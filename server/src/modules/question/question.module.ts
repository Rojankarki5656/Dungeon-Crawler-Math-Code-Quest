import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { QuestionRepository } from './question.repository';

@Module({
  controllers: [QuestionController],
  providers: [QuestionRepository, QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}