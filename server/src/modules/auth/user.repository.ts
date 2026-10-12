import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../infra/redis/redis.service';
import type { User } from '../../common/types/domain.types';

/**
 * Redis-backed user store.
 *
 * Schema:
 *   user:email:<email>  → <userId>           (unique index)
 *   user:<userId>       → JSON(User)         (record)
 *
 * Redis is fine for a demo / single-region deployment. If you need durable
 * storage later, swap this class for a Postgres repository — the interface
 * is the only contract callers depend on.
 */
@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly redis: RedisService) {}

  private idKey(id: string) {
    return this.redis.key('user', id);
  }
  private emailKey(email: string) {
    return this.redis.key('user', 'email', email.toLowerCase());
  }

  async findByEmail(email: string): Promise<User | null> {
    const id = await this.redis.client.get(this.emailKey(email));
    if (!id) return null;
    return this.findById(id);
  }

  async findById(id: string): Promise<User | null> {
    return this.redis.getJson<User>(this.idKey(id));
  }

  async create(user: User): Promise<void> {
    // NX on the email index prevents two signups racing to the same address.
    const claimed = await this.redis.client.set(
      this.emailKey(user.email),
      user.id,
      'NX',
    );
    if (claimed !== 'OK') {
      throw new Error('EMAIL_TAKEN');
    }
    await this.redis.setJson(this.idKey(user.id), user);
  }

  async save(user: User): Promise<void> {
    await this.redis.setJson(this.idKey(user.id), user);
  }
}