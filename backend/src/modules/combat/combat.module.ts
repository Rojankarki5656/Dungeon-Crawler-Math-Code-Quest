import { Module } from '@nestjs/common';
import { CombatService } from './combat.service';
import { EncounterStore } from './encounter.store';
import { LobbyModule } from '../lobby/lobby.module';
import { DungeonModule } from '../dungeon/dungeon.module';
import { QuestionModule } from '../question/question.module';

@Module({
  imports: [LobbyModule, DungeonModule, QuestionModule],
  providers: [EncounterStore, CombatService],
  exports: [CombatService, EncounterStore],
})
export class CombatModule {}