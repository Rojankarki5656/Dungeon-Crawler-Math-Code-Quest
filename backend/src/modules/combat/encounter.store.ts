import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../infra/redis/redis.service';
import type { Encounter } from '../../common/types/domain.types';

@Injectable()
export class EncounterStore {
  private readonly ttl: number;
  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.ttl = this.config.get<number>('game.encounterTtlSeconds', 120);
  }

  private key(id: string) { return this.redis.key('encounter', id); }
  private activeKey(playerId: string) { return this.redis.key('encounter', 'active', playerId); }

  async create(encounter: Encounter): Promise<void> {
    const pipeline = this.redis.client.pipeline();
    pipeline.set(this.key(encounter.id), JSON.stringify(encounter), 'EX', this.ttl);
    pipeline.set(this.activeKey(encounter.playerId), encounter.id, 'EX', this.ttl);
    await pipeline.exec();
  }

  async get(id: string): Promise<Encounter | null> {
    return this.redis.getJson<Encounter>(this.key(id));
  }

  async save(encounter: Encounter): Promise<void> {
    const ttl = Math.max(5, Math.ceil((encounter.expiresAt - Date.now()) / 1000));
    await this.redis.client.set(this.key(encounter.id), JSON.stringify(encounter), 'EX', ttl);
  }

  async getActiveForPlayer(playerId: string): Promise<Encounter | null> {
    const id = await this.redis.client.get(this.activeKey(playerId));
    if (!id) return null;
    const enc = await this.get(id);
    if (!enc || enc.status !== 'pending' || enc.expiresAt < Date.now()) return null;
    return enc;
  }

  async clearActive(playerId: string): Promise<void> {
    await this.redis.client.del(this.activeKey(playerId));
  }

  /**
   * Atomic answer-claim. Guarantees exactly ONE validation result per attempt,
   * even with N validation workers racing on the same encounter.
   * Returns the encounter when this caller wins the race, else null.
   */
  async claimAnswer(encounterId: string, nonce: string): Promise<Encounter | null> {
    const claimKey = this.redis.key('encounter', encounterId, 'claim', nonce);
    const claimed = await this.redis.client.set(claimKey, '1', 'EX', 30, 'NX');
    if (claimed !== 'OK') return null; // duplicate / concurrent submission
    return this.get(encounterId);
  }
}