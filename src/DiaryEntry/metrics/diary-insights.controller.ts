import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/JwtAuthGuard';
import { DiaryService } from '../Diary/diary.service';
import { Request } from 'express';

@Controller('diary')
@UseGuards(JwtAuthGuard)
export class DiaryInsightsController {
  constructor(private readonly diaryService: DiaryService) {}

  @Get('insights')
  async getInsights(@Req() req: Request) {
    const userId = req['user']?.userId || req['user']?.id;
    return this.diaryService.getInsights(userId);
  }

  @Get('graph-data')
  async getGraphData(@Req() req: Request, @Query('period') period: string) {
    const userId = req['user']?.userId || req['user']?.id;
    return this.diaryService.getGraphData(userId, period);
  }
}
