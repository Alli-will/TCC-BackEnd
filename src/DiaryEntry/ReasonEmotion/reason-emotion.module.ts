import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReasonEmotion } from '../entity/reason-emotion.entity';
import { ReasonEmotionService } from './reason-emotion.service';
import { ReasonEmotionController } from './reason-emotion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReasonEmotion])],
  providers: [ReasonEmotionService],
=======
import { ReasonEmotionService } from './reason-emotion.service';
import { ReasonEmotionController } from './reason-emotion.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  providers: [ReasonEmotionService, PrismaService],
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
  controllers: [ReasonEmotionController],
  exports: [ReasonEmotionService],
})
export class ReasonEmotionModule {}
