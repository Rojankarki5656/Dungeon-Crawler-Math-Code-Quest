import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BrokerService } from '../infra/broker/broker.service';
import { TOPICS } from '../common/constants/topics';

/**
 * Non-WebSocket observability consumer.
 * Subscribes with a UNIQUE group per instance so every API node logs every
 * domain event — useful for tracing, metrics and debugging without
 * affecting the WebSocket fanout path.
 */
@Injectable()
export class GatewayFanoutConsumer implements OnModuleInit {
  private readonly logger = new Logger('DomainEvents');

  constructor(private readonly broker: BrokerService) {}

  onModuleInit() {
    const group = this.broker.fanoutGroup('observability');
    const topics = [
      TOPICS.ENCOUNTER_TRIGGERED, TOPICS.ENCOUNTER_RESOLVED,
      TOPICS.ANSWER_SUBMITTED, TOPICS.ROUND_WON, TOPICS.ROUND_LOST,
      TOPICS.QUESTION_FETCH_REQUESTED, TOPICS.QUESTION_FETCH_COMPLETED,
      TOPICS.PLAYER_MOVED,
    ];
    for (const t of topics) {
      void this.broker.subscribe(t, group, async () => {
        this.logger.debug(`event: ${t}`);
      }, { maxAttempts: 1 }).catch(() => undefined);
    }
  }
}