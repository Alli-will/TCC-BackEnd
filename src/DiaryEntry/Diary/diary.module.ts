import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryEntry } from '../entity/Diary-entry.entity';
import { DiaryService } from './diary.service';
import { DiaryController } from './diary.controller';
import { UserModule } from '../../user/user.module';
import { ReasonEmotion } from '../entity/reason-emotion.entity';
import { NotificationModule } from '../../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([DiaryEntry, ReasonEmotion]),UserModule,NotificationModule], 
  controllers: [DiaryController],
  providers: [DiaryService],
  exports: [DiaryService],
})
export class DiaryModule {}