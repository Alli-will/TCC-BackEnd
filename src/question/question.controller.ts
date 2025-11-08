import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
import { Roles, UserRole } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller('questions')
export class QuestionController {
  constructor(private service: QuestionService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(
    @Query('modalidade') modalidade?: 'pulso' | 'clima',
    @Query('tipo') tipo?: 'qualitativa' | 'quantitativa',
    @Query('ativo') ativo?: string,
    @Req() req?: any,
  ) {
    const companyId = req?.user?.companyId;
    const where: any = {};
    if (modalidade) where.modalidade = modalidade;
    if (tipo) where.tipoResposta = tipo;
    if (ativo === '0' || ativo === 'false') where.ativo = false;
    if (ativo === '1' || ativo === 'true') where.ativo = true;
    return this.service.list(companyId, where);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateQuestionDto, @Req() req: any) {
    return this.service.create(dto, req?.user?.companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOne(@Param('id') id: string, @Req() req: any) {
    return this.service.getOne(Number(id), req?.user?.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @Req() req: any,
  ) {
    return this.service.update(Number(id), dto, req?.user?.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(Number(id), req?.user?.companyId);
  }
}
