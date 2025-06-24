import { Module } from '@nestjs/common';
import { DiaryInsightsController } from './diary-insights.controller';
import { DiaryModule } from '../Diary/diary.module';

@Module({
  imports: [DiaryModule],
  controllers: [DiaryInsightsController],
})
export class DiaryInsightsModule {}
