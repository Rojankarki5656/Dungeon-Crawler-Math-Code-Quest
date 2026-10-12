import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  /**
   * Command client — used for XADD, XACK, XGROUP, GET, SET, HSET, …
   *
   * Created SYNCHRONOUSLY in the constructor. ioredis returns the client
   * immediately and queues commands internally until the socket is ready,
   * so any consumer can safely use `client.xgroup(...)` right after
   * `RedisService` is constructed — no `onModuleInit` timing dependency.
   */
  public readonly client: Redis;

  /** Reserved for pub/sub subscriber mode. */
  public readonly subscriber: Redis;

  /** Every blocking client we hand out, so we can close them on shutdown. */
  private readonly blockingClients: Redis[] = [];

  public readonly keyPrefix: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('redis.url', 'redis://localhost:6379');
    this.keyPrefix = this.config.get<string>('redis.keyPrefix', 'dcq');

    const opts = {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times: number) => Math.min(times * 200, 3_000),
      reconnectOnError: () => true,
    };

    this.client = new Redis(url, opts);
    this.subscriber = new Redis(url, opts);

    for (const [name, c] of [['client', this.client], ['subscriber', this.subscriber]] as const) {
      c.on('error', (e) => this.logger.error(`[${name}] ${e.message}`));
      c.on('reconnecting', () => this.logger.warn(`[${name}] reconnecting...`));
      c.on('ready', () => this.logger.log(`[${name}] ready`));
    }

    this.logger.log('Redis clients initialised (connecting in background)');
  }

  /**
   * Creates a NEW ioredis connection for exclusive use by blocking commands
   * (`XREADGROUP ... BLOCK`). One reader per connection — canonical ioredis
   * pattern, because BLOCK monopolizes the socket until it returns.
   */
  createBlockingClient(): Redis {
    const url = this.config.get<string>('redis.url', 'redis://localhost:6379');
    const c = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times: number) => Math.min(times * 200, 3_000),
      reconnectOnError: () => true,
    });
    c.on('error', (e) => this.logger.error(`[blocking] ${e.message}`));
    this.blockingClients.push(c);
    return c;
  }

  key(...parts: (string | number)[]): string {
    return [this.keyPrefix, ...parts].join(':');
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds) await this.client.set(key, payload, 'EX', ttlSeconds);
    else await this.client.set(key, payload);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  }

  async hsetJson(key: string, field: string, value: unknown, ttlSeconds?: number) {
    const pipeline = this.client.pipeline();
    pipeline.hset(key, field, JSON.stringify(value));
    if (ttlSeconds) pipeline.expire(key, ttlSeconds);
    await pipeline.exec();
  }

  async hgetJson<T>(key: string, field: string): Promise<T | null> {
    const raw = await this.client.hget(key, field);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  }

  async health(): Promise<boolean> {
    try { return (await this.client.ping()) === 'PONG'; } catch { return false; }
  }

  async onModuleDestroy() {
    await Promise.allSettled([
      this.client?.quit(),
      this.subscriber?.quit(),
      ...this.blockingClients.map((c) => c.disconnect()),
    ]);
  }
}