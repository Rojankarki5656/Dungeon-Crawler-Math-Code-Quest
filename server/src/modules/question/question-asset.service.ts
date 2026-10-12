import { Injectable } from '@nestjs/common';
import { RedisService } from '../../infra/redis/redis.service';

@Injectable()
export class QuestionAssetService {
  constructor(private readonly redis: RedisService) {}

  /** Caches the image URL for a question ID (optional, for fast lookups). */
  async cacheImageUrl(questionId: string, imageUrl: string): Promise<void> {
    const key = this.redis.key('banana', 'image', questionId);
    await this.redis.client.set(key, imageUrl, 'EX', 300);
  }

  /** Retrieves a cached image URL. */
  async getImageUrl(questionId: string): Promise<string | null> {
    const key = this.redis.key('banana', 'image', questionId);
    return this.redis.client.get(key);
  }
}