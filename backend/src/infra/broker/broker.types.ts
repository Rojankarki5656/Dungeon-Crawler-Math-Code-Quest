export interface BrokerMessage<T = unknown> {
  id: string;
  topic: string;
  payload: T;
  attempts: number;
  enqueuedAt: number;
  correlationId?: string;
}

export type MessageHandler<T = unknown> = (msg: BrokerMessage<T>) => Promise<void>;

export interface PublishOptions {
  correlationId?: string;
  /** Delay before the message becomes visible (ms). */
  delayMs?: number;
  headers?: Record<string, string>;
}

export interface SubscribeOptions {
  /** Max delivery attempts before routing to the DLQ. */
  maxAttempts?: number;
  /** Prefetch / batch size. */
  prefetch?: number;
  /** Enable idempotent consumption (dedupe by message id). */
  idempotent?: boolean;
}

export interface BrokerTransport {
  readonly name: string;
  publish<T>(topic: string, payload: T, opts?: PublishOptions): Promise<string>;
  subscribe<T>(
    topic: string,
    group: string,
    handler: MessageHandler<T>,
    opts?: SubscribeOptions,
  ): Promise<() => Promise<void>>;
  health(): Promise<boolean>;
  close(): Promise<void>;
}

export const BROKER_TRANSPORT = Symbol('BROKER_TRANSPORT');