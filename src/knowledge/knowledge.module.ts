import { Module } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  controllers: [KnowledgeController],
  providers: [KnowledgeService, PrismaService, NotificationService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
