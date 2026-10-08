import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BrokerService } from '../../infra/broker/broker.service';
import { QuestionService } from '../question/question.service';
import { EncounterStore } from '../combat/encounter.store';
import { GROUPS, TOPICS } from '../../common/constants/topics';
import type { AnswerSubmittedEvent, RoundResultEvent } from '../../common/types/domain.types';

/**
 * Validation Worker
 * -----------------
 * Consumes `answer.submitted`, compares against the solution held on the
 * encounter record, and emits `round.won` / `round.lost`.
 *
 * The comparison itself is constant-time (see QuestionService.verify).
 * The `claimAnswer` step guarantees exactly-one verdict per (encounter, nonce),
 * even with N validation workers racing on the same submission.
 */
@Injectable()
export class ValidationWorker implements OnModuleInit {
  private readonly logger = new Logger(ValidationWorker.name);
  private processed = 0;
  private failed = 0;

  constructor(
    private readonly broker: BrokerService,
    private readonly questions: QuestionService,
    private readonly encounters: EncounterStore,
  ) {}

  onModuleInit() {
    void this.broker.subscribe<AnswerSubmittedEvent>(
      TOPICS.ANSWER_SUBMITTED,
      GROUPS.VALIDATION_WORKERS,
      (msg) => this.handle(msg.payload, msg.id),
      { prefetch: 20, maxAttempts: 3, idempotent: false },
    );
    this.logger.log('Validation worker online');
  }

  private async handle(evt: AnswerSubmittedEvent, messageId: string): Promise<void> {
    // Atomic claim — guarantees exactly-one verdict per (encounter, nonce).
    const encounter = await this.encounters.claimAnswer(evt.encounterId, evt.nonce);
    if (!encounter) {
      this.logger.debug(`Duplicate/concurrent submission ignored: ${evt.encounterId}`);
      return;
    }

    if (encounter.status !== 'pending') return;

    // Question not fetched yet — the client should have blocked this, but
    // guard anyway. Silent drop; the player will get a fresh try.
    if (!encounter.solution) {
      this.logger.warn(
        `Rejecting answer — question not ready for encounter=${evt.encounterId.slice(0, 8)}`,
      );
      return;
    }

    // ✅ Was `this.questions.verify(...)` without await — that returned a
    // Promise<boolean>, which is always truthy. Now `verify` is synchronous.
    const correct = this.questions.verify(encounter.solution, evt.answer);
    const latencyMs = Date.now() - evt.submittedAt;

    if (correct) this.processed++; else this.failed++;

    this.logger.log(
      `[${messageId.slice(0, 8)}] ${correct ? 'WIN ' : 'LOSE'} ` +
      `enc=${evt.encounterId.slice(0, 8)} latency=${latencyMs}ms`,
    );

    const result: RoundResultEvent = {
      encounterId: evt.encounterId,
      lobbyId: evt.lobbyId,
      playerId: evt.playerId,
      correct,
      damageDealt: correct ? 1 : 0,
    };

    await this.broker.publish(
      correct ? TOPICS.ROUND_WON : TOPICS.ROUND_LOST,
      result,
      { safe: true, correlationId: messageId },
    );
  }

  stats() { return { processed: this.processed, failed: this.failed }; }
}