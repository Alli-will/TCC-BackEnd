import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupportMaterialDto } from './dto/create-support-material.dto';
import { UpdateSupportMaterialDto } from './dto/update-support-material.dto';

@Injectable()
export class SupportMaterialService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSupportMaterialDto) {
    return this.prisma.supportMaterial.create({ data });
  }

  async findAll() {
    return this.prisma.supportMaterial.findMany({ where: { deleted_at: null } });
  }

  async findOne(id: number) {
    const material = await this.prisma.supportMaterial.findFirst({ where: { id, deleted_at: null } });
    if (!material) throw new NotFoundException('Material de apoio não encontrado');
    return material;
  }

  async update(id: number, data: UpdateSupportMaterialDto) {
    const material = await this.prisma.supportMaterial.findFirst({ where: { id, deleted_at: null } });
    if (!material) throw new NotFoundException('Material de apoio não encontrado');
    return this.prisma.supportMaterial.update({ where: { id }, data });
  }

  async remove(id: number) {
    const material = await this.prisma.supportMaterial.findFirst({ where: { id, deleted_at: null } });
    if (!material) throw new NotFoundException('Material de apoio não encontrado');
    return this.prisma.supportMaterial.update({ where: { id }, data: { deleted_at: new Date() } });
  }
}
