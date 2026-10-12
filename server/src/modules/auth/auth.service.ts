import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';

import { UserRepository } from './user.repository';
import { RedisService } from '../../infra/redis/redis.service';
import type { AuthResult, JwtPayload, PublicUser, User } from '../../common/types/domain.types';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  // =======================================================================
  // SIGNUP
  // =======================================================================
  async signup(email: string, password: string, playerName: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    // Pre-check for a friendlier error than the repository's thrown one.
    const existing = await this.users.findByEmail(normalizedEmail);
    if (existing) throw new UnauthorizedException('EMAIL_TAKEN');

    // Also guard against two users with the same *playerName* — the dungeon
    // leaderboard displays it, so collisions are confusing.
    const nameTaken = await this.redis.client.get(
      this.redis.key('user', 'name', playerName.toLowerCase()),
    );
    if (nameTaken) throw new UnauthorizedException('PLAYER_NAME_TAKEN');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user: User = {
      id: randomUUID(),
      email: normalizedEmail,
      playerName,
      passwordHash,
      createdAt: Date.now(),
      totalScore: 0,
      gamesPlayed: 0,
    };

    await this.users.create(user);
    // Reserve the player-name slot. No TTL — permanent reservation.
    await this.redis.client.set(
      this.redis.key('user', 'name', playerName.toLowerCase()),
      user.id,
      'NX',
    );

    this.logger.log(`Signup: ${user.email} (${user.playerName})`);
    return this.issueToken(user);
  }

  // =======================================================================
  // LOGIN
  // =======================================================================
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      // Generic message so attackers can't enumerate emails.
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('INVALID_CREDENTIALS');

    user.lastLoginAt = Date.now();
    await this.users.save(user);

    this.logger.log(`Login: ${user.email}`);
    return this.issueToken(user);
  }

  // =======================================================================
  // TOKEN / USER LOOKUPS
  // =======================================================================
  private async issueToken(user: User): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      playerName: user.playerName,
    };
    const token = await this.jwt.signAsync(payload);
    return { token, user: toPublicUser(user) };
  }

  async verifyToken(token: string): Promise<PublicUser | null> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const user = await this.users.findById(payload.sub);
      return user ? toPublicUser(user) : null;
    } catch {
      return null;
    }
  }

  async getUser(id: string): Promise<PublicUser | null> {
    const user = await this.users.findById(id);
    return user ? toPublicUser(user) : null;
  }

  /** Called by CombatService on `finishEncounter` to accumulate stats. */
  async recordScore(userId: string, scoreDelta: number): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) return;
    user.totalScore += scoreDelta;
    user.gamesPlayed += 1;
    await this.users.save(user);
  }
}

function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    playerName: u.playerName,
    createdAt: u.createdAt,
    totalScore: u.totalScore,
    gamesPlayed: u.gamesPlayed,
  };
}