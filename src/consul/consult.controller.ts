/*import { Controller, Post, Body, Get, Put, Delete, UseGuards, Request, Param } from '@nestjs/common';
import { ConsultService } from './consult.service';
import { CreateConsultDto } from './Dto/CreateConsultDto';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
import { Consult } from './entity/consult.entity';

@Controller('consult')
export class ConsultController {
  constructor(private readonly consultService: ConsultService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@Body() createConsultDto: CreateConsultDto, @Request() req) {
    const userId = req.user.id;
    await this.consultService.create(createConsultDto, userId);
    return { message: 'Consulta criada com sucesso!' };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findByUser(@Request() req): Promise<Consult[]> {
    const userId = req.user.id;
    return this.consultService.findByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('type/:type')
  async findByType(@Request() req, @Param('type') type: 'psychologist' | 'psychiatrist'): Promise<Consult[]> {
    const userId = req.user.id;
    return this.consultService.findByType(userId, type);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async update(
    @Param('id') id: number,
    @Body() updateData: Partial<CreateConsultDto>,
    @Request() req,
  ) {
    const userId = req.user.id;
    const consult = await this.consultService.update(id, updateData, userId);
    return consult;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')  
  async delete(
    @Param('id') id: number,
    @Request() req,
  ) {
    const userId = req.user.id;
    await this.consultService.delete(id, userId);
    return { message: 'Consulta cancelada com sucesso!' };
  }
}
  */