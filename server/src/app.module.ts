import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';

import { RedisModule } from './infra/redis/redis.module';
import { BrokerModule } from './infra/broker/broker.module';
import { IdempotencyService } from './infra/resilience/idempotency.service';

import { HealthModule } from './modules/health/health.module';
import { QuestionModule } from './modules/question/question.module';
import { DungeonModule } from './modules/dungeon/dungeon.module';
import { LobbyModule } from './modules/lobby/lobby.module';
import { CombatModule } from './modules/combat/combat.module';

import { GameGateway } from './gateways/game.gateway';
import { GatewayFanoutConsumer } from './gateways/gateway-fanout.consumer';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    RedisModule,
    BrokerModule,
    AuthModule,
    HealthModule,
    QuestionModule,
    DungeonModule,
    LobbyModule,
    CombatModule,
  ],
  providers: [
    IdempotencyService,
    GameGateway,
    GatewayFanoutConsumer,
  ],
})
export class AppModule {}