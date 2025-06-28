import { Controller, Post, Body, Get, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
import { BehavioralAnalysisService } from './behavioral-analysis.service';
import { CreateBehavioralAnalysisDto } from './dto/create-behavioral-analysis.dto';
import { UpdateBehavioralAnalysisDto } from './dto/update-behavioral-analysis.dto';

@UseGuards(JwtAuthGuard)
@Controller('behavioral-analysis')
export class BehavioralAnalysisController {
  constructor(private readonly service: BehavioralAnalysisService) {}

  @Post()
  create(@Body() dto: CreateBehavioralAnalysisDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBehavioralAnalysisDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
