import { Controller, Post, Body, Get, Put, Delete, UseGuards, Request, Param } from '@nestjs/common';
import { ConsulService } from './consul.service';
import { CreateConsulDto } from './dto/CreateConsulDto';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
import { Consul } from './entity/consul.entity';

@Controller('consul')
export class ConsulController {
  constructor(private readonly consulService: ConsulService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@Body() createConsulDto: CreateConsulDto, @Request() req) {
    const userId = req.user.id;
    await this.consulService.create(createConsulDto, userId);
    return { message: 'Consulta criada com sucesso!' };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findByUser(@Request() req): Promise<Consul[]> {
    const userId = req.user.id;
    return this.consulService.findByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('type/:type')
  async findByType(@Request() req, @Param('type') type: 'psychologist' | 'psychiatrist'): Promise<Consul[]> {
    const userId = req.user.id;
    return this.consulService.findByType(userId, type);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async update(
    @Param('id') id: number,
    @Body() updateData: Partial<CreateConsulDto>,
    @Request() req,
  ) {
    const userId = req.user.id;
    const consul = await this.consulService.update(id, updateData, userId);
    return consul;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')  
  async delete(
    @Param('id') id: number,
    @Request() req,
  ) {
    const userId = req.user.id;
    await this.consulService.delete(id, userId);
    return { message: 'Consulta cancelada com sucesso!' };
  }
}