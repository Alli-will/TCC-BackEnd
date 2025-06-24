import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { UserModule } from '../user/user.module';
import { DiaryModule } from '../DiaryEntry/Diary/diary.module';

@Module({
  imports: [UserModule, DiaryModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
