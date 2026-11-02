import { EventEmitter } from "node:events";
import { logger } from "../config/logger.js";

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }
  // Async-safe emit: isolates handler errors so one failed listener does not break others
  async emitAsync(type, payload) {
    logger.debug({ type, payload }, "event:emit");
    const listeners = this.listeners(type);
    await Promise.allSettled(
      listeners.map(async (fn) => {
        try {
          await fn(payload);
        } catch (err) {
          logger.error({ err, type }, "event:handler failed");
        }
      })
    );
  }
}

export const eventBus = new EventBus();