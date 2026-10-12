import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BrokerService } from '../../infra/broker/broker.service';
import { QuestionService } from '../question/question.service';
import { EncounterStore } from '../combat/encounter.store';
import { GROUPS, TOPICS } from '../../common/constants/topics';
import type {
  QuestionFetchCompletedEvent,
  QuestionFetchRequestedEvent,
} from '../../common/types/domain.types';

/**
 * Fetch Worker
 * ------------
 * Consumes `question.fetch.requested`, calls the external Banana API,
 * and writes the resulting { imageUrl, solution, questionDamage } onto the
 * encounter record. On success, emits `question.fetch.completed` so the
 * gateway can push the image URL to the client.
 *
 * Failure path: broker retries with exponential backoff; after maxAttempts
 * the message lands in the DLQ (see DlqWorker).
 */
@Injectable()
export class FetchWorker implements OnModuleInit {
  private readonly logger = new Logger(FetchWorker.name);
  private fetched = 0;
  private failed = 0;

  constructor(
    private readonly broker: BrokerService,
    private readonly questions: QuestionService,
    private readonly encounters: EncounterStore,
  ) {}

  onModuleInit() {
    void this.broker.subscribe<QuestionFetchRequestedEvent>(
      TOPICS.QUESTION_FETCH_REQUESTED,
      GROUPS.FETCH_WORKERS,
      (msg) => this.handle(msg.payload),
      { prefetch: 5, maxAttempts: 4, idempotent: true },
    );
    this.logger.log('Fetch worker online (Banana API)');
  }

  private async handle(evt: QuestionFetchRequestedEvent): Promise<void> {
    const started = Date.now();

    const encounter = await this.encounters.get(evt.encounterId);
    if (!encounter) {
      this.logger.warn(`Encounter ${evt.encounterId} not found — skipping fetch`);
      return;
    }

    try {
      const question = await this.questions.fetchOne(evt.difficulty);

      encounter.solution = question.solution;
      encounter.imageUrl = question.imageUrl;
      encounter.questionDamage = question.damage;
      await this.encounters.save(encounter);

      this.fetched++;
      this.logger.log(
        `Fetched question for encounter=${evt.encounterId.slice(0, 8)} ` +
        `(difficulty=${evt.difficulty}, ${Date.now() - started}ms) ` +
        `url=${question.imageUrl.split('/').pop()}`,
      );

      const payload: QuestionFetchCompletedEvent = {
        encounterId: encounter.id,
        lobbyId: encounter.lobbyId,
        imageUrl: question.imageUrl,
        cachedAt: Date.now(),
      };
      await this.broker.publish(TOPICS.QUESTION_FETCH_COMPLETED, payload, { safe: true });
    } catch (err: any) {
      this.failed++;
      this.logger.error(
        `Fetch FAILED for encounter=${evt.encounterId.slice(0, 8)}: ${err.message}`,
      );

      await this.broker.publish(TOPICS.QUESTION_FETCH_FAILED, {
        encounterId: encounter.id,
        lobbyId: encounter.lobbyId,
        error: err.message,
        at: Date.now(),
      }, { safe: true });

      throw err; // broker will retry / DLQ
    }
  }

  stats() { return { fetched: this.fetched, failed: this.failed }; }
}