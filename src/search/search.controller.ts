import { Controller, Post, Body, Param, Delete, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
import { SearchService, getDefaultQuestions } from './search.service';
import { CreateSearchDto } from './dto/create-search.dto';
import { RespondSearchDto } from './dto/respond-search.dto';

@Controller('searches')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('excludeRespondedUserId') _excludeRespondedUserId?: string, @Req() req?: any) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 10;
    const ex = req?.user?.id; // sempre usar usuário autenticado para excluir respondidas
    return this.searchService.findAll(p, l, ex);
  }

  // Colocar antes de :id para não conflitar (evitar tratar 'defaults' como id)
  @UseGuards(JwtAuthGuard)
  @Get('defaults/questions')
  defaults(@Query('tipo') tipo?: string) {
    return { perguntas: getDefaultQuestions(tipo) };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.searchService.findOne(Number(id), req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('respond')
  respond(@Body() dto: RespondSearchDto, @Req() req: any) {
    return this.searchService.respond(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createSearchDto: CreateSearchDto) {
    return this.searchService.create(createSearchDto);
  }


  @UseGuards(JwtAuthGuard)
  @Post(':id/questions')
  addQuestion(
    @Param('id') id: string,
    @Body() question: { texto: string; opcoes: any; obrigatoria?: boolean },
  ) {
    return this.searchService.addQuestion(Number(id), question);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/questions/:index')
  removeQuestion(
    @Param('id') id: string,
    @Param('index') index: string
  ) {
    return this.searchService.removeQuestion(Number(id), Number(index));
  }
}
