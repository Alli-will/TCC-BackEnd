import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  list(companyId?: number, where: any = {}) {
    const scope = companyId ? { OR: [{ companyId }, { companyId: null }] } : {};
    return this.prisma.question.findMany({
      where: { ...where, ...scope },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(id: number, companyId?: number) {
    const q = await this.prisma.question.findFirst({ where: { id, ...(companyId ? { OR: [{ companyId }, { companyId: null }] } : {}) } as any });
    if (!q) throw new NotFoundException('Pergunta não encontrada');
    return q;
  }

  async create(dto: CreateQuestionDto, companyId?: number) {
    return this.prisma.question.create({ data: { ...dto, companyId } as any });
  }

  async update(id: number, dto: UpdateQuestionDto, companyId?: number) {
    // Garantir escopo: só permite editar se pertence ao companyId ou é global (null)
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q || (companyId && q.companyId && q.companyId !== companyId)) {
      throw new NotFoundException('Pergunta não encontrada');
    }
    return this.prisma.question.update({ where: { id }, data: dto as any });
  }

  async remove(id: number, companyId?: number) {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q || (companyId && q.companyId && q.companyId !== companyId)) {
      throw new NotFoundException('Pergunta não encontrada');
    }
    return this.prisma.question.delete({ where: { id } });
  }
}
