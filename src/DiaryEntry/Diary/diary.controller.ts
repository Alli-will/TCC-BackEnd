import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { CreateDiaryEntryDto } from './dto/Create-Diary-Entry-Dto';
import { JwtAuthGuard } from '../../auth/JwtAuthGuard';
import { Roles, UserRole } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createDiaryEntry(@Body() createDiaryEntryDto: CreateDiaryEntryDto, @Request() req) {
  const userId = req.user?.id;
  await this.diaryService.create(createDiaryEntryDto, userId);
  return { message: 'Entrada do diário criada com sucesso!' };
  }
  @UseGuards(JwtAuthGuard)
  @Get()
  async findEntries(@Request() req: any): Promise<any[]> {
    const userId = req.user.id; 
    return this.diaryService.findEntriesByUserId(userId); 
  }

  // Endpoint legado usado pelo front ao logar; mantido para compatibilidade
  @UseGuards(JwtAuthGuard)
  @Get('has-entry-today')
  async hasEntryToday(@Request() req: any) {
    const userId = req.user.id;
    const hasEntry = await this.diaryService.hasEntryToday(userId);
    return { hasEntry };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('all')
  @Roles(UserRole.ADMIN)
  async findAllDiaries(@Request() req: any) {
    return this.diaryService.findAllDiaries(undefined, req.user?.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('emotion-percentages')
  @Roles(UserRole.ADMIN)
  async getEmotionPercentages(@Request() req: any) {
    return this.diaryService.getEmotionPercentages(req.user?.companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('graph-data')
  async getGraphData(@Request() req, @Body() body: any): Promise<any> {
    const userId = req.user.id;
    // period pode vir como query param, mas para compatibilidade, tenta pegar do body também
    const period = req.query.period || body.period || 'semana';
    return this.diaryService.getGraphData(userId, period);
  }

  @UseGuards(JwtAuthGuard)
  @Get('insights')
  async getInsights(@Request() req) {
    const userId = req.user.id;
    return this.diaryService.getInsights(userId);
  }
}