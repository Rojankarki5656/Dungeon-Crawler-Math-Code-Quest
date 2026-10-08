import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class IdempotencyService {
  constructor(private readonly redis: RedisService) {}

  /** Returns true if this is the first time we've seen `key`. */
  async claim(scope: string, key: string, ttlSeconds = 3600): Promise<boolean> {
    const redisKey = this.redis.key('idem', scope, key);
    const res = await this.redis.client.set(redisKey, '1', 'EX', ttlSeconds, 'NX');
    return res === 'OK';
  }
}