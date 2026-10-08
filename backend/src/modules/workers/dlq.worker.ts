import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BrokerService } from '../../infra/broker/broker.service';
import { RedisService } from '../../infra/redis/redis.service';
import { GROUPS, TOPICS } from '../../common/constants/topics';

/**
 * Dead Letter Queue Worker
 * ------------------------
 * Terminal handler for messages that exhausted all retries.
 * Persists them for forensic replay + emits structured logs for alerting.
 */
@Injectable()
export class DlqWorker implements OnModuleInit {
  private readonly logger = new Logger(DlqWorker.name);
  private readonly MAX_DLQ_ENTRIES = 1000;

  constructor(
    private readonly broker: BrokerService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    void this.broker.subscribe(
      TOPICS.DEAD_LETTER,
      GROUPS.DLQ_WORKERS,
      async (msg) => this.handle(msg.payload as any),
      { maxAttempts: 1 }, // never retry the DLQ itself
    );
    this.logger.log('DLQ worker online');
  }

  private async handle(payload: {
    originalTopic: string; consumerGroup: string;
    error: string; failedAt: number; instanceId: string;
    originalMessage: { id: string; payload: unknown };
  }) {
    const key = this.redis.key('dlq', payload.originalTopic);
    await this.redis.client
      .lpush(key, JSON.stringify(payload))
      .then(() => this.redis.client.ltrim(key, 0, this.MAX_DLQ_ENTRIES - 1))
      .catch(() => undefined);

    this.logger.error(
      `DLQ | topic=${payload.originalTopic} group=${payload.consumerGroup} ` +
      `msgId=${payload.originalMessage?.id} err="${payload.error}"`,
    );
  }
}