import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as amqp from 'amqplib';
import type {
  BrokerMessage, BrokerTransport, MessageHandler, PublishOptions, SubscribeOptions,
} from '../broker.types';

// amqplib v0.10+ returns ChannelModel (previously Connection).
type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;

export class RabbitMqTransport implements BrokerTransport {
  readonly name = 'rabbitmq';
  private readonly logger = new Logger(RabbitMqTransport.name);
  private conn?: AmqpConnection;
  private pubChannel?: AmqpChannel;
  private readonly consumers: Array<{ channel: AmqpChannel; tag: string }> = [];
  private closing = false;

  constructor(private readonly url: string) {}

  private async ensureConnection(): Promise<void> {
    if (this.conn) return;
    this.conn = await amqp.connect(this.url);
    this.conn.on('error', (e: Error) => this.logger.error(`conn: ${e.message}`));
    this.conn.on('close', () => {
      this.conn = undefined;
      this.pubChannel = undefined;
      if (!this.closing) setTimeout(() => void this.ensureConnection().catch(() => {}), 1500);
    });
  }

  private async ensurePublisher(): Promise<AmqpChannel> {
    await this.ensureConnection();
    if (this.pubChannel) return this.pubChannel;
    const ch = await this.conn!.createChannel();
    await ch.assertExchange('dcq.events', 'topic', { durable: true });
    this.pubChannel = ch;
    return ch;
  }

  async publish<T>(topic: string, payload: T, opts: PublishOptions = {}): Promise<string> {
    const ch = await this.ensurePublisher();
    const id = randomUUID();
    ch.publish('dcq.events', topic, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      messageId: id,
      correlationId: opts.correlationId,
      headers: { attempts: 0, ...opts.headers },
      expiration: opts.delayMs ? String(opts.delayMs) : undefined,
    });
    return id;
  }

  async subscribe<T>(
    topic: string,
    group: string,
    handler: MessageHandler<T>,
    opts: SubscribeOptions = {},
  ): Promise<() => Promise<void>> {
    await this.ensureConnection();
    const ch = await this.conn!.createChannel();
    await ch.prefetch(opts.prefetch ?? 10);

    const exchange = 'dcq.events';
    const dlx = 'dcq.dlx';
    const queue = `q.${topic}.${group}`;
    const dlq = `q.dlq.${topic}.${group}`;

    await ch.assertExchange(exchange, 'topic', { durable: true });
    await ch.assertExchange(dlx, 'topic', { durable: true });
    await ch.assertQueue(dlq, { durable: true });
    await ch.bindQueue(dlq, dlx, topic);
    await ch.assertQueue(queue, {
      durable: true,
      deadLetterExchange: dlx,
      deadLetterRoutingKey: topic,
    });
    await ch.bindQueue(queue, exchange, topic);

    const { consumerTag } = await ch.consume(queue, async (raw: amqp.ConsumeMessage | null) => {
      if (!raw) return;
      const attempts = Number(raw.properties.headers?.attempts ?? 0);
      try {
        const payload = JSON.parse(raw.content.toString()) as T;
        const msg: BrokerMessage<T> = {
          id: raw.properties.messageId ?? randomUUID(),
          topic,
          payload,
          attempts,
          enqueuedAt: Date.now(),
          correlationId: raw.properties.correlationId,
        };
        await handler(msg);
        ch.ack(raw);
      } catch (err: any) {
        const max = opts.maxAttempts ?? 3;
        if (attempts + 1 >= max) {
          this.logger.warn(`DLQ ${topic} after ${attempts + 1} attempts: ${err.message}`);
          ch.nack(raw, false, false);
        } else {
          ch.publish(exchange, topic, raw.content, {
            ...raw.properties,
            headers: { ...raw.properties.headers, attempts: attempts + 1 },
          });
          ch.ack(raw);
        }
      }
    });

    this.consumers.push({ channel: ch, tag: consumerTag });
    return async () => { await ch.cancel(consumerTag).catch(() => {}); };
  }

  async health(): Promise<boolean> {
    try { await this.ensureConnection(); return !!this.conn; } catch { return false; }
  }

  async close(): Promise<void> {
    this.closing = true;
    await Promise.allSettled(this.consumers.map((c) => c.channel.close()));
    await this.pubChannel?.close().catch(() => {});
    await this.conn?.close().catch(() => {});
  }
}