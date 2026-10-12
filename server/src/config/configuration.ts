export interface AppConfig {
  env: string;
  port: number;
  corsOrigin: string;
  redis: { url: string; keyPrefix: string };
  broker: {
    transport: 'memory' | 'redis-streams' | 'rabbitmq';
    rabbitUrl: string;
    maxAttempts: number;
    consumerName: string;
  };
  game: {
    questionAssetCacheTtl: number;
    encounterTtlSeconds: number;
  };
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'dcq',
  },
  broker: {
    transport: (process.env.BROKER_TRANSPORT as any) ?? 'redis-streams',
    rabbitUrl: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
    maxAttempts: parseInt(process.env.BROKER_MAX_ATTEMPTS ?? '3', 10),
    consumerName: process.env.BROKER_CONSUMER_NAME ?? `instance-${process.pid}`,
  },
  game: {
    questionAssetCacheTtl: parseInt(process.env.QUESTION_ASSET_CACHE_TTL ?? '900', 10),
    encounterTtlSeconds: parseInt(process.env.ENCOUNTER_TTL_SECONDS ?? '120', 10),
  },
});