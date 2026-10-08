import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';

import { RedisModule } from './infra/redis/redis.module';
import { BrokerModule } from './infra/broker/broker.module';

import { QuestionModule } from './modules/question/question.module';
import { DungeonModule } from './modules/dungeon/dungeon.module';
import { LobbyModule } from './modules/lobby/lobby.module';
import { CombatModule } from './modules/combat/combat.module';
import { WorkersModule } from './modules/workers/workers.module';

/**
 * Worker process — NO HTTP server, NO WebSocket gateway.
 * Pure event consumers. Scale independently from the API tier.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    RedisModule,
    BrokerModule,
    QuestionModule,
    DungeonModule,
    LobbyModule,
    CombatModule,
    WorkersModule,
  ],
})
export class WorkerModule {}