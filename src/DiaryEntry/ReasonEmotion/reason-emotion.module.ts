import { Module } from '@nestjs/common';
import { ReasonEmotionService } from './reason-emotion.service';
import { ReasonEmotionController } from './reason-emotion.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  providers: [ReasonEmotionService, PrismaService],
  controllers: [ReasonEmotionController],
  exports: [ReasonEmotionService],
})
export class ReasonEmotionModule {}
