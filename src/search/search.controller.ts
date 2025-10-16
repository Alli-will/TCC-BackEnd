import { Controller, Post, Body, Param, Delete, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
import { SearchService, getDefaultQuestions } from './search.service';
import { CreateSearchDto } from './dto/create-search.dto';
import { RespondSearchDto } from './dto/respond-search.dto';
import { Roles, UserRole } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('searches')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('all') all?: string, @Req() req?: any) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 10;
    const role = req?.user?.role;
    const wantAll = role === 'admin' && (all === '1' || all === 'true');
    const ex = wantAll ? undefined : req?.user?.id;
    try {
      return this.searchService.findAll(p, l, ex, req?.user?.companyId);
    } catch (e: any) {
      return { items: [], meta: { total: 0, page: p, limit: l, totalPages: 1 }, error: 'Falha ao carregar pesquisas', detail: e?.message };
    }
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
    return this.searchService.findOne(Number(id), req.user.id, req.user.companyId);
  }

  // Relatório detalhado da pesquisa (indicadores por pergunta / NPS / distribuições)
  @UseGuards(JwtAuthGuard)
  @Get(':id/report')
  report(@Param('id') id: string, @Query('departmentId') departmentId?: string, @Req() req?: any) {
    return this.searchService.getReport(Number(id), departmentId ? Number(departmentId) : undefined, req?.user?.companyId);
  }

  // Respostas textuais (qualitativas) anonimizadas de uma pergunta específica
  @UseGuards(JwtAuthGuard)
  @Get(':id/text-answers')
  textAnswers(
    @Param('id') id: string,
    @Query('questionIndex') questionIndex: string,
    @Query('departmentId') departmentId?: string,
    @Req() req?: any,
  ) {
    return this.searchService.getTextAnswers(
      Number(id),
      Number(questionIndex),
      departmentId ? Number(departmentId) : undefined,
      req?.user?.companyId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('respond')
  respond(@Body() dto: RespondSearchDto, @Req() req: any) {
    return this.searchService.respond(dto, req.user.id, req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createSearchDto: CreateSearchDto, @Req() req: any) {
    return this.searchService.create(createSearchDto, req.user.companyId);
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
