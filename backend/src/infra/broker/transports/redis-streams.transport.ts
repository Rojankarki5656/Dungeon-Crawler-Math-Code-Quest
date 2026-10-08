import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisService } from '../../redis/redis.service';
import type {
  BrokerMessage, BrokerTransport, MessageHandler, PublishOptions, SubscribeOptions,
} from '../broker.types';

const STREAM_PREFIX = 'stream';
const MAXLEN = 50_000;
const BLOCK_MS = 3_000;
const CLAIM_IDLE_MS = 30_000;

/**
 * Redis Streams transport.
 *
 *  - XADD for durable, ordered append.
 *  - Consumer groups => competing consumers OR per-instance fanout.
 *  - XAUTOCLAIM recovers messages from crashed consumers.
 *  - MAXLEN ~ caps memory growth.
 *
 * IMPORTANT: blocking reads (XREADGROUP BLOCK, XAUTOCLAIM) run on
 * DEDICATED connections obtained from `RedisService.createBlockingClient()`.
 * Never share the command client with a blocking command — every other
 * command would queue behind it.
 */
export class RedisStreamsTransport implements BrokerTransport {
  readonly name = 'redis-streams';
  private readonly logger = new Logger(RedisStreamsTransport.name);
  private readonly stoppers: Array<() => void> = [];
  private closed = false;

  constructor(private readonly redis: RedisService) {}

  private streamKey(topic: string) {
    return this.redis.key(STREAM_PREFIX, topic);
  }

  async publish<T>(topic: string, payload: T, opts: PublishOptions = {}): Promise<string> {
    const id = randomUUID();
    const fields: string[] = [
      'id', id,
      'topic', topic,
      'payload', JSON.stringify(payload),
      'attempts', '0',
      'enqueuedAt', String(Date.now()),
      'correlationId', opts.correlationId ?? '',
    ];
    // Non-blocking command → shared command client is correct here.
    await this.redis.client.xadd(
      this.streamKey(topic), 'MAXLEN', '~', String(MAXLEN), '*', ...fields,
    );
    return id;
  }

  async subscribe<T>(
    topic: string,
    group: string,
    handler: MessageHandler<T>,
    opts: SubscribeOptions = {},
  ): Promise<() => Promise<void>> {
    const key = this.streamKey(topic);
    const consumer = `c-${randomUUID().slice(0, 8)}`;

    // (1) Group creation — a normal command, safe on the shared client.
    //     Wrapped in try/catch because a second subscribe to the same topic
    //     correctly reports BUSYGROUP.
    try {
      await this.redis.client.xgroup('CREATE', key, group, '$', 'MKSTREAM');
    } catch (e: any) {
      if (!String(e.message).includes('BUSYGROUP')) throw e;
    }

    // (2) Allocate dedicated blocking connections — one for the read loop,
    //     one for the reclaim loop. Sharing either with the command client
    //     would stall every XADD/XACK/XGROUP issued elsewhere.
    const readClient  = this.redis.createBlockingClient();
    const claimClient = this.redis.createBlockingClient();

    let running = true;
    const stop = () => { running = false; };
    this.stoppers.push(stop);

    // ---- Main read loop ------------------------------------------------
    void (async () => {
      while (running && !this.closed) {
        try {
          const res = (await readClient.xreadgroup(
            'GROUP', group, consumer,
            'COUNT', String(opts.prefetch ?? 10),
            'BLOCK', String(BLOCK_MS),
            'STREAMS', key, '>',
          )) as any;

          if (!res) continue;

          for (const [, entries] of res) {
            for (const [entryId, flat] of entries) {
              const msg = this.toMessage(topic, entryId, flat);
              try {
                await handler(msg as BrokerMessage<T>);
              } finally {
                // XACK on the SHARED client — it's a fast command that must
                // not queue behind any other connection's BLOCK.
                await this.redis.client.xack(key, group, entryId).catch(() => undefined);
              }
            }
          }
        } catch (err: any) {
          if (!this.closed) this.logger.error(`xreadgroup ${topic}: ${err.message}`);
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      try { readClient.disconnect(); } catch { /* noop */ }
    })();

    // ---- Reclaim loop (crash recovery) ---------------------------------
    void (async () => {
      while (running && !this.closed) {
        try {
          await new Promise((r) => setTimeout(r, CLAIM_IDLE_MS));
          if (!running) break;

          const res = (await claimClient.xautoclaim(
            key, group, consumer, CLAIM_IDLE_MS, '0-0', 'COUNT', 20,
          )) as any;

          const entries = res?.[1] ?? [];
          for (const [entryId, flat] of entries) {
            if (!flat || !flat.length) continue;
            const msg = this.toMessage(topic, entryId, flat);
            try {
              await handler(msg as BrokerMessage<T>);
            } finally {
              await this.redis.client.xack(key, group, entryId).catch(() => undefined);
            }
          }
        } catch { /* non-fatal */ }
      }
      try { claimClient.disconnect(); } catch { /* noop */ }
    })();

    // Return a stop handle. `.disconnect()` is immediate (no graceful quit)
    // because ioredis `quit()` on a client mid-BLOCK would wait for the
    // block to expire. The recovery loop must exit on its own tick anyway.
    return async () => {
      stop();
      setTimeout(() => {
        try { readClient.disconnect(); } catch { /* noop */ }
        try { claimClient.disconnect(); } catch { /* noop */ }
      }, 200);
    };
  }

  private toMessage(topic: string, entryId: string, flat: string[]): BrokerMessage {
    const obj: Record<string, string> = {};
    for (let i = 0; i < flat.length; i += 2) obj[flat[i]] = flat[i + 1];
    let payload: unknown = null;
    try { payload = JSON.parse(obj.payload ?? 'null'); } catch { /* keep null */ }
    return {
      id: obj.id ?? entryId,
      topic: obj.topic ?? topic,
      payload,
      attempts: Number(obj.attempts ?? 0),
      enqueuedAt: Number(obj.enqueuedAt ?? Date.now()),
      correlationId: obj.correlationId || undefined,
    };
  }

  async health() { return this.redis.health(); }

  async close() {
    this.closed = true;
    this.stoppers.forEach((s) => s());
  }
}