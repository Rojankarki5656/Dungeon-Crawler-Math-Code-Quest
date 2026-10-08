import { Module } from '@nestjs/common';
import { ValidationWorker } from './validation.worker';
import { FetchWorker } from './fetch.worker';
import { DlqWorker } from './dlq.worker';
import { QuestionModule } from '../question/question.module';
import { CombatModule } from '../combat/combat.module';

@Module({
  imports: [QuestionModule, CombatModule],
  providers: [ValidationWorker, FetchWorker, DlqWorker],
  exports: [ValidationWorker, FetchWorker, DlqWorker],
})
export class WorkersModule {}