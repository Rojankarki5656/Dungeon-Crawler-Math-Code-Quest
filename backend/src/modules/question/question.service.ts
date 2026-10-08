import { Injectable, Logger } from '@nestjs/common';
import { QuestionRepository } from './question.repository';
import type { FetchedQuestion } from '../../common/types/domain.types';

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  constructor(private readonly repo: QuestionRepository) {}

  /** Fetch a fresh Banana question (image + solution). */
  async fetchOne(difficulty: 1 | 2 | 3 = 2): Promise<FetchedQuestion> {
    return this.repo.fetchOne(difficulty);
  }

  /**
   * Constant-time-ish comparison to avoid timing side-channels.
   * Both sides are trimmed & lowercased before comparison.
   */
  verify(expected: string, submitted: string): boolean {
    const a = (expected ?? '').trim().toLowerCase();
    const b = (submitted ?? '').trim().toLowerCase();
    if (a.length === 0 || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }
}