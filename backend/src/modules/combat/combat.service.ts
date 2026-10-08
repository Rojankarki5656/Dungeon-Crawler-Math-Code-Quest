import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BrokerService } from '../../infra/broker/broker.service';
import { RedisService } from '../../infra/redis/redis.service';
import { LobbyService } from '../lobby/lobby.service';
import { DungeonService } from '../dungeon/dungeon.service';
import { QuestionService } from '../question/question.service';
import { EncounterStore } from './encounter.store';
import { GROUPS, TOPICS } from '../../common/constants/topics';
import { PLAYER } from '../../common/constants/game.constants';
import type {
  AnswerSubmittedEvent, Encounter, EncounterResolvedEvent,
  EncounterTriggeredEvent, PlayerMovedEvent, RoundResultEvent,
} from '../../common/types/domain.types';

const MAX_ATTEMPTS_PER_ENCOUNTER = 6;
const DIFFICULTY_DAMAGE: Record<number, number> = { 1: 8, 2: 14, 3: 22 };

@Injectable()
export class CombatService implements OnModuleInit {
  private readonly logger = new Logger(CombatService.name);

  constructor(
    private readonly broker: BrokerService,
    private readonly redis: RedisService,
    private readonly lobbies: LobbyService,
    private readonly dungeon: DungeonService,
    private readonly questions: QuestionService,
    private readonly encounters: EncounterStore,
  ) {}

  onModuleInit() {
    void this.broker.subscribe<PlayerMovedEvent>(
      TOPICS.PLAYER_MOVED,
      GROUPS.COMBAT_WORKERS,
      (msg) => this.handlePlayerMoved(msg.payload),
      { idempotent: true, maxAttempts: 3 },
    );

    void this.broker.subscribe<RoundResultEvent>(
      TOPICS.ROUND_WON,
      GROUPS.COMBAT_WORKERS,
      (msg) => this.handleRoundResult(msg.payload),
      { idempotent: true, maxAttempts: 3 },
    );
    void this.broker.subscribe<RoundResultEvent>(
      TOPICS.ROUND_LOST,
      GROUPS.COMBAT_WORKERS,
      (msg) => this.handleRoundResult(msg.payload),
      { idempotent: true, maxAttempts: 3 },
    );
  }

  // =======================================================================
  // ENCOUNTER TRIGGERING
  // =======================================================================
  private async handlePlayerMoved(evt: PlayerMovedEvent): Promise<void> {
    const existing = await this.encounters.getActiveForPlayer(evt.playerId);
    if (existing) return;

    const monsters = await this.dungeon.getMonsters(evt.lobbyId);
    const monster = this.dungeon.monsterAt(monsters, evt.to.x, evt.to.y);
    if (!monster) return;

    const now = Date.now();
    const encounter: Encounter = {
      id: randomUUID(),
      lobbyId: evt.lobbyId,
      playerId: evt.playerId,
      monsterId: monster.id,
      solution: '',                       // filled by FetchWorker
      imageUrl: '',                       // filled by FetchWorker
      questionDamage: DIFFICULTY_DAMAGE[monster.difficulty] ?? 14,
      status: 'pending',
      attempts: 0,
      createdAt: now,
      expiresAt: now + 120_000,
    };
    await this.encounters.create(encounter);

    const payload: EncounterTriggeredEvent = {
      encounterId: encounter.id,
      lobbyId: evt.lobbyId,
      playerId: evt.playerId,
      monster,
      expiresAt: encounter.expiresAt,
      retry: false,
      attemptsLeft: MAX_ATTEMPTS_PER_ENCOUNTER,
    };
    await this.broker.publish(TOPICS.ENCOUNTER_TRIGGERED, payload, { safe: true });

    // Kick off async question fetch — the game loop never blocks on this.
    await this.broker.publish(TOPICS.QUESTION_FETCH_REQUESTED, {
      encounterId: encounter.id,
      difficulty: monster.difficulty as 1 | 2 | 3,
    }, { safe: true });

    this.logger.log(
      `Encounter ${encounter.id.slice(0, 8)} vs ${monster.name} ` +
      `(difficulty=${monster.difficulty}) for ${evt.playerId.slice(0, 8)}`,
    );
  }

  // =======================================================================
  // ROUND RESOLUTION
  // =======================================================================
  private async handleRoundResult(result: RoundResultEvent): Promise<void> {
    const encounter = await this.encounters.get(result.encounterId);
    if (!encounter || encounter.status !== 'pending') {
      this.logger.warn(
        `Round result dropped — encounter ${result.encounterId.slice(0, 8)} ` +
        `missing or status=${encounter?.status ?? 'none'}`,
      );
      return;
    }

    const player = await this.lobbies.getPlayer(result.playerId);
    if (!player) {
      this.logger.warn(`Round result dropped — player ${result.playerId.slice(0, 8)} gone`);
      return;
    }

    const monsters = await this.dungeon.getMonsters(encounter.lobbyId);
    const monster = monsters.find((m) => m.id === encounter.monsterId);
    if (!monster) {
      this.logger.warn(`Round result dropped — monster ${encounter.monsterId} gone`);
      await this.finishEncounter(encounter, 'expired', player, 0, false);
      return;
    }

    const damage = encounter.questionDamage
      || DIFFICULTY_DAMAGE[monster.difficulty]
      || 14;

    let xpGained = 0;
    let monsterDefeated = false;

    if (result.correct) {
      monster.hp = Math.max(0, monster.hp - damage);
      monsterDefeated = monster.hp <= 0;
      xpGained = damage * monster.difficulty;
      player.score += xpGained;
      await this.dungeon.saveMonsters(encounter.lobbyId, monsters);
    } else {
      player.hp = Math.max(0, player.hp - Math.round(monster.damage * 0.6));
    }

    encounter.attempts += 1;

    this.logger.log(
      `Round ${result.correct ? 'WIN' : 'LOSE'} enc=${encounter.id.slice(0, 8)} ` +
      `attempts=${encounter.attempts}/${MAX_ATTEMPTS_PER_ENCOUNTER} ` +
      `monsterHp=${monster.hp}/${monster.maxHp} playerHp=${player.hp}`,
    );

    // ---- Terminal outcomes ---------------------------------------------
    if (monsterDefeated) {
      this.logger.log(`→ monster DEFEATED, resolving encounter`);
      await this.dungeon.killMonster(encounter.lobbyId, monster.id);
      await this.finishEncounter(encounter, 'won', player, xpGained, true);
      return;
    }
    if (player.hp <= 0) {
      this.logger.log(`→ player DIED, respawning`);
      player.hp = PLAYER.MAX_HP;
      const map = await this.dungeon.getMap(encounter.lobbyId);
      if (map) { player.x = map.spawn.x; player.y = map.spawn.y; }
      await this.finishEncounter(encounter, 'lost', player, 0, false);
      return;
    }
    if (encounter.attempts >= MAX_ATTEMPTS_PER_ENCOUNTER) {
      this.logger.log(`→ attempts EXHAUSTED (${MAX_ATTEMPTS_PER_ENCOUNTER}), resolving encounter`);
      await this.finishEncounter(encounter, 'expired', player, 0, false);
      return;
    }

    // ---- Retry with a FRESH question ----------------------------------
    this.logger.log(`→ RETRY with fresh question`);
    encounter.solution = '';
    encounter.imageUrl = '';
    encounter.expiresAt = Date.now() + 120_000;
    await this.encounters.save(encounter);
    await this.lobbies.savePlayer(player);
    await this.lobbies.updatePlayerInLobby(encounter.lobbyId, player);

    await this.broker.publish(TOPICS.ENCOUNTER_TRIGGERED, {
      encounterId: encounter.id,
      lobbyId: encounter.lobbyId,
      playerId: player.id,
      monster,
      expiresAt: encounter.expiresAt,
      retry: true,
      attemptsLeft: MAX_ATTEMPTS_PER_ENCOUNTER - encounter.attempts,
    }, { safe: true });

    await this.broker.publish(TOPICS.QUESTION_FETCH_REQUESTED, {
      encounterId: encounter.id,
      difficulty: monster.difficulty as 1 | 2 | 3,
    }, { safe: true });
  }

  private async finishEncounter(
    encounter: Encounter,
    status: Encounter['status'],
    player: any,
    xpGained: number,
    monsterDefeated: boolean,
  ) {
    encounter.status = status;
    await this.encounters.save(encounter);
    await this.encounters.clearActive(player.id);

    await this.lobbies.savePlayer(player);
    await this.lobbies.updatePlayerInLobby(encounter.lobbyId, player);

    const resolved: EncounterResolvedEvent = {
      encounterId: encounter.id,
      lobbyId: encounter.lobbyId,
      playerId: player.id,
      monsterId: encounter.monsterId,
      monsterDefeated,
      playerHp: player.hp,
      playerScore: player.score,
      xpGained,
    };
    await this.broker.publish(TOPICS.ENCOUNTER_RESOLVED, resolved, { safe: true });
    await this.broker.publish(
      TOPICS.LEADERBOARD_UPDATED,
      { lobbyId: encounter.lobbyId },
      { safe: true },
    );
  }

  // =======================================================================
  // PUBLIC — called by the gateway on answer submit
  // =======================================================================
  async submitAnswer(params: {
    encounterId: string; playerId: string; answer: string; nonce: string;
  }): Promise<{ accepted: boolean; reason?: string }> {
    const encounter = await this.encounters.get(params.encounterId);
    if (!encounter) return { accepted: false, reason: 'ENCOUNTER_NOT_FOUND' };
    if (encounter.playerId !== params.playerId) return { accepted: false, reason: 'NOT_YOUR_ENCOUNTER' };
    if (encounter.status !== 'pending') return { accepted: false, reason: 'ENCOUNTER_CLOSED' };
    if (encounter.expiresAt < Date.now()) return { accepted: false, reason: 'ENCOUNTER_EXPIRED' };
    if (!encounter.solution) return { accepted: false, reason: 'QUESTION_NOT_READY' };

    const payload: AnswerSubmittedEvent = {
      encounterId: params.encounterId,
      playerId: params.playerId,
      lobbyId: encounter.lobbyId,
      answer: params.answer,
      nonce: params.nonce,
      submittedAt: Date.now(),
    };
    await this.broker.publish(TOPICS.ANSWER_SUBMITTED, payload, { safe: true });
    return { accepted: true };
  }

  async abandonEncounter(params: {
    encounterId: string; playerId: string;
  }): Promise<{ ok: boolean; reason?: string }> {
    const encounter = await this.encounters.get(params.encounterId);
    if (!encounter) return { ok: false, reason: 'ENCOUNTER_NOT_FOUND' };
    if (encounter.playerId !== params.playerId) return { ok: false, reason: 'NOT_YOUR_ENCOUNTER' };
    if (encounter.status !== 'pending') return { ok: false, reason: 'ENCOUNTER_CLOSED' };

    const player = await this.lobbies.getPlayer(params.playerId);
    if (!player) return { ok: false, reason: 'PLAYER_NOT_FOUND' };

    await this.finishEncounter(encounter, 'expired', player, 0, false);
    return { ok: true };
  }
}