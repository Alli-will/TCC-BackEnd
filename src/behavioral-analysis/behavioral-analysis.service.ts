import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBehavioralAnalysisDto } from './dto/create-behavioral-analysis.dto';
import { UpdateBehavioralAnalysisDto } from './dto/update-behavioral-analysis.dto';

@Injectable()
export class BehavioralAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBehavioralAnalysisDto) {
    return this.prisma.behavioralAnalysis.create({ data: dto });
  }

  async findAll() {
    return this.prisma.behavioralAnalysis.findMany();
  }

  async findOne(id: number) {
    const analysis = await this.prisma.behavioralAnalysis.findUnique({ where: { id } });
    if (!analysis) throw new NotFoundException('Behavioral analysis not found');
    return analysis;
  }

  async update(id: number, dto: UpdateBehavioralAnalysisDto) {
    const analysis = await this.prisma.behavioralAnalysis.findUnique({ where: { id } });
    if (!analysis) throw new NotFoundException('Behavioral analysis not found');
    return this.prisma.behavioralAnalysis.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    return this.prisma.behavioralAnalysis.update({ where: { id }, data: { deleted_at: new Date() } });
  }
}
