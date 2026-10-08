import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RedisService } from '../redis/redis.service';
import { computeBackoff, sleep } from '../../common/utils/backoff';
import { TOPICS } from '../../common/constants/topics';
import { BROKER_TRANSPORT } from './broker.types';
import type {
  BrokerMessage, BrokerTransport, MessageHandler, PublishOptions, SubscribeOptions,
} from './broker.types';

export interface BrokerPublishOptions extends PublishOptions {
  /** Fire-and-forget when true — never rejects into caller code. */
  safe?: boolean;
}

@Injectable()
export class BrokerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BrokerService.name);
  private readonly unsubscribers: Array<() => Promise<void>> = [];
  private readonly maxAttempts: number;
  private readonly instanceId: string;

  constructor(
    @Inject(BROKER_TRANSPORT) private readonly transport: BrokerTransport,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.maxAttempts = this.config.get<number>('broker.maxAttempts', 3);
    this.instanceId = this.config.get<string>('broker.consumerName', `i-${process.pid}`);
  }

  onModuleInit() {
    this.logger.log(`Broker transport: ${this.transport.name} (instance=${this.instanceId})`);
  }

  async publish<T>(topic: string, payload: T, opts: BrokerPublishOptions = {}): Promise<string | null> {
    const meta: PublishOptions = {
      correlationId: opts.correlationId ?? randomUUID(),
      delayMs: opts.delayMs,
      headers: opts.headers,
    };
    try {
      return await this.transport.publish(topic, payload, meta);
    } catch (err: any) {
      this.logger.error(`publish ${topic} failed: ${err.message}`);
      if (opts.safe) return null;
      throw err;
    }
  }

  /**
   * Subscribe with retry + exponential backoff + DLQ + optional idempotency.
   * The wrapped handler is the ONLY place fault-tolerance policy lives.
   */
  async subscribe<T>(
    topic: string,
    group: string,
    handler: MessageHandler<T>,
    opts: SubscribeOptions = {},
  ): Promise<void> {
    const maxAttempts = opts.maxAttempts ?? this.maxAttempts;

    const wrapped: MessageHandler<T> = async (msg) => {
      // --- Idempotency guard ---------------------------------------------
      if (opts.idempotent) {
        const dedupeKey = this.redis.key('idem', group, msg.id);
        const first = await this.redis.client.set(dedupeKey, '1', 'EX', 3600, 'NX');
        if (first === null) {
          this.logger.debug(`duplicate ${msg.id} skipped (${group})`);
          return;
        }
      }

      // --- Retry loop ------------------------------------------------------
      let lastErr: unknown;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          await handler(msg);
          return;
        } catch (err) {
          lastErr = err;
          const isLast = attempt === maxAttempts - 1;
          this.logger.warn(
            `${topic} handler attempt ${attempt + 1}/${maxAttempts} failed: ${(err as Error).message}`,
          );
          if (!isLast) await sleep(computeBackoff(attempt));
        }
      }

      // --- Dead-letter -----------------------------------------------------
      this.logger.error(`${topic} exhausted retries -> DLQ (msg=${msg.id})`);
      await this.publish(TOPICS.DEAD_LETTER, {
        originalTopic: topic,
        originalMessage: msg,
        consumerGroup: group,
        error: (lastErr as Error)?.message ?? 'unknown',
        failedAt: Date.now(),
        instanceId: this.instanceId,
      }, { safe: true }).catch(() => undefined);
    };

    const stop = await this.transport.subscribe<T>(topic, group, wrapped, opts);
    this.unsubscribers.push(stop);
  }

  /** Unique consumer group per instance => true broadcast fanout. */
  fanoutGroup(base: string): string {
    return `${base}:${this.instanceId}`;
  }

  async health(): Promise<boolean> {
    try { return await this.transport.health(); } catch { return false; }
  }

  async onModuleDestroy() {
    await Promise.allSettled(this.unsubscribers.map((u) => u()));
    await this.transport.close().catch(() => undefined);
  }
}