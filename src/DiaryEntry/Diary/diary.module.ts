import { Module } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { DiaryController } from './diary.controller';
import { UserModule } from '../../user/user.module';
import { NotificationModule } from '../../notification/notification.module';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  imports: [UserModule, NotificationModule],
  controllers: [DiaryController],
  providers: [DiaryService, PrismaService],
  exports: [DiaryService],
})
export class DiaryModule {}