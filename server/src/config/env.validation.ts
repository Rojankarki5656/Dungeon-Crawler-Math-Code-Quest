import { plainToInstance, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min, validateSync } from 'class-validator';

class EnvSchema {
  @IsString() @IsOptional() NODE_ENV = 'development';
  @Type(() => Number) @IsInt() @Min(1) @IsOptional() PORT = 4000;
  @IsString() @IsOptional() CORS_ORIGIN = 'http://localhost:5173';
  @IsString() @IsOptional() REDIS_URL = 'redis://localhost:6379';
  @IsString() @IsOptional() REDIS_KEY_PREFIX = 'dcq';
  @IsIn(['memory', 'redis-streams', 'rabbitmq']) @IsOptional()
  BROKER_TRANSPORT: 'memory' | 'redis-streams' | 'rabbitmq' = 'redis-streams';
  @IsString() @IsOptional() RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
  @Type(() => Number) @IsInt() @IsOptional() BROKER_MAX_ATTEMPTS = 3;
  @IsString() @IsOptional() BROKER_CONSUMER_NAME = 'instance-1';
  @Type(() => Number) @IsInt() @IsOptional() QUESTION_ASSET_CACHE_TTL = 900;
  @Type(() => Number) @IsInt() @IsOptional() ENCOUNTER_TTL_SECONDS = 120;
}

export function validateEnv(raw: Record<string, unknown>) {
  const parsed = plainToInstance(EnvSchema, raw, { enableImplicitConversion: true });
  const errors = validateSync(parsed, { skipMissingProperties: false });
  if (errors.length) throw new Error(`Invalid env config: ${errors.toString()}`);
  return parsed;
}