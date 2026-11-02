import { TeacherAPIProvider } from "./TeacherAPIProvider.js";
import { LocalQuestionProvider } from "./LocalQuestionProvider.js";
import { eventBus } from "../events/eventBus.js";
import { EVENTS } from "../events/eventTypes.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

/** Simple circuit breaker: opens after N consecutive failures for a cooldown window. */
class CircuitBreaker {
  constructor({ threshold, cooldownMs }) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
    this.failures = 0;
    this.openUntil = 0;
  }
  isOpen() { return Date.now() < this.openUntil; }
  recordSuccess() { this.failures = 0; }
  recordFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.openUntil = Date.now() + this.cooldownMs;
      this.failures = 0;
      logger.warn("circuit breaker opened");
    }
  }
}

class QuestionService {
  constructor() {
    this.teacher = new TeacherAPIProvider();
    this.local = new LocalQuestionProvider();
    this.breaker = new CircuitBreaker(env.circuitBreaker);
  }

  async generate({ difficulty = 1 } = {}) {

    console.log(env.teacherApi.enabled && !this.breaker.isOpen());
    
    if (env.teacherApi.enabled && !this.breaker.isOpen()) {
      try {
        const q = await this.teacher.generate({ difficulty });
        this.breaker.recordSuccess();
        await eventBus.emitAsync(EVENTS.QUESTION_GENERATED, { provider: "teacher", difficulty });
        return { ...q, provider: "teacher" };
      } catch (err) {
        this.breaker.recordFailure();
        logger.warn({ err: err.message }, "teacher provider failed, falling back");
        await eventBus.emitAsync(EVENTS.EXTERNAL_API_FAILED, { error: err.message });
        await eventBus.emitAsync(EVENTS.FALLBACK_PROVIDER_USED, {});
      }
    }
    const q = await this.local.generate({ difficulty });
    await eventBus.emitAsync(EVENTS.QUESTION_GENERATED, { provider: "local", difficulty });
    return { ...q, provider: "local" };
  }
}

export const questionService = new QuestionService();