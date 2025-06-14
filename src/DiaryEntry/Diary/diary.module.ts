import { Module } from '@nestjs/common';
<<<<<<< HEAD
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
=======
import { DiaryService } from './diary.service';
import { DiaryController } from './diary.controller';
import { UserModule } from '../../user/user.module';
import { NotificationModule } from '../../notification/notification.module';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  imports: [UserModule, NotificationModule],
  controllers: [DiaryController],
  providers: [DiaryService, PrismaService],
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
  exports: [DiaryService],
})
export class DiaryModule {}