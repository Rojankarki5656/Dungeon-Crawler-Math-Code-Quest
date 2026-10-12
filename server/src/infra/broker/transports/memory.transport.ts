import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  BrokerMessage, BrokerTransport, MessageHandler, PublishOptions, SubscribeOptions,
} from '../broker.types';

interface Sub { group: string; handler: MessageHandler<any>; opts: SubscribeOptions; }

/**
 * In-process transport — used for unit tests and local dev without infra.
 * Preserves at-least-once semantics and per-group competing consumers.
 */
export class MemoryTransport implements BrokerTransport {
  readonly name = 'memory';
  private readonly logger = new Logger(MemoryTransport.name);
  private readonly subs = new Map<string, Sub[]>();
  private readonly groups = new Map<string, number>(); // round-robin cursor
  private closed = false;

  async publish<T>(topic: string, payload: T, opts: PublishOptions = {}): Promise<string> {
    const id = randomUUID();
    const msg: BrokerMessage<T> = {
      id, topic, payload,
      attempts: 0,
      enqueuedAt: Date.now(),
      correlationId: opts.correlationId,
    };
    const deliver = () => this.dispatch(msg);
    if (opts.delayMs && opts.delayMs > 0) setTimeout(deliver, opts.delayMs);
    else queueMicrotask(deliver);
    return id;
  }

  private dispatch<T>(msg: BrokerMessage<T>) {
    if (this.closed) return;
    const subs = this.subs.get(msg.topic) ?? [];
    if (!subs.length) return;

    // Group by consumer-group, round-robin within a group (competing consumers).
    const byGroup = new Map<string, Sub[]>();
    for (const s of subs) {
      const arr = byGroup.get(s.group) ?? [];
      arr.push(s);
      byGroup.set(s.group, arr);
    }
    for (const [group, members] of byGroup) {
      const cursorKey = `${msg.topic}::${group}`;
      const idx = (this.groups.get(cursorKey) ?? 0) % members.length;
      this.groups.set(cursorKey, idx + 1);
      const sub = members[idx];
      Promise.resolve(sub.handler(msg)).catch((e) =>
        this.logger.error(`handler error on ${msg.topic}: ${e?.message}`),
      );
    }
  }

  async subscribe<T>(
    topic: string,
    group: string,
    handler: MessageHandler<T>,
    opts: SubscribeOptions = {},
  ): Promise<() => Promise<void>> {
    const arr = this.subs.get(topic) ?? [];
    const sub: Sub = { group, handler: handler as MessageHandler<any>, opts };
    arr.push(sub);
    this.subs.set(topic, arr);
    return async () => {
      const list = this.subs.get(topic) ?? [];
      const i = list.indexOf(sub);
      if (i >= 0) list.splice(i, 1);
    };
  }

  async health() { return !this.closed; }

  async close() {
    this.closed = true;
    this.subs.clear();
    this.groups.clear();
  }
}