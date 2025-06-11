import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReasonEmotion } from '../entity/reason-emotion.entity';
import { ReasonEmotionService } from './reason-emotion.service';
import { ReasonEmotionController } from './reason-emotion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReasonEmotion])],
  providers: [ReasonEmotionService],
  controllers: [ReasonEmotionController],
  exports: [ReasonEmotionService],
})
export class ReasonEmotionModule {}
