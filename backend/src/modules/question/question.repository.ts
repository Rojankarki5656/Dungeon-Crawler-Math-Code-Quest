import { Injectable, Logger } from '@nestjs/common';
import type { FetchedQuestion } from '../../common/types/domain.types';

const BANANA_API_URL = 'https://marcconrad.com/uob/banana/api.php';
const FETCH_TIMEOUT_MS = 8_000;

const DIFFICULTY_DAMAGE: Record<1 | 2 | 3, number> = { 1: 8, 2: 14, 3: 22 };

interface BananaResponse {
  question?: string;
  solution?: number | string;
}

/**
 * Fetches one fresh question from the external Banana API.
 *
 * The API is stateless and returns a new pair on each call:
 *   { "question": "https://www.sanfoh.com/uob/banana/data/....png",
 *     "solution": 9 }
 *
 * We do not cache questions here — every encounter gets a unique one.
 * Solution caching is handled by the FetchWorker, keyed by encounterId.
 */
@Injectable()
export class QuestionRepository {
  private readonly logger = new Logger(QuestionRepository.name);

  async fetchOne(difficulty: 1 | 2 | 3 = 2): Promise<FetchedQuestion> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(BANANA_API_URL, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Banana API responded ${res.status} ${res.statusText}`);
      }

      const body = (await res.json()) as BananaResponse;

      if (!body?.question || body?.solution === undefined || body?.solution === null) {
        throw new Error(`Malformed Banana payload: ${JSON.stringify(body)}`);
      }

      return {
        imageUrl: String(body.question),
        solution: String(body.solution).trim(),
        damage: DIFFICULTY_DAMAGE[difficulty],
        difficulty,
      };
    } catch (err) {
      this.logger.error(`Banana fetch failed: ${(err as Error).message}`);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}