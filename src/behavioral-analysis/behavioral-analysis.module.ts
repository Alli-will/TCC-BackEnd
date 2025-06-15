import { Module } from '@nestjs/common';
import { BehavioralAnalysisService } from './behavioral-analysis.service';
import { BehavioralAnalysisController } from './behavioral-analysis.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BehavioralAnalysisController],
  providers: [BehavioralAnalysisService],
  exports: [BehavioralAnalysisService],
})
export class BehavioralAnalysisModule {}
