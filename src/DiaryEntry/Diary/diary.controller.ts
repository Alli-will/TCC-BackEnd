import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { CreateDiaryEntryDto } from '../dto/Create-Diary-Entry-Dto';
import { JwtAuthGuard } from '../../auth/JwtAuthGuard';
import { DiaryEntry } from '../entity/Diary-entry.entity';

@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createDiaryEntry(@Body() createDiaryEntryDto: CreateDiaryEntryDto, @Request() req) {
    const userId = req.user.id;
    await this.diaryService.create(createDiaryEntryDto, userId);
    return { message: 'Entrada do diário criada com sucesso!' };
  }
  @UseGuards(JwtAuthGuard)
  @Get()
  async findEntries(@Request() req: any): Promise<DiaryEntry[]> {
    const userId = req.user.id; 
    return this.diaryService.findEntriesByUserId(userId); 
  }

  @UseGuards(JwtAuthGuard)
  @Get('has-entry-today')
  async hasEntryToday(@Request() req: any) {
  const userId = req.user.id;
  const hasEntry = await this.diaryService.hasEntryToday(userId);
  return { hasEntry };
}


}