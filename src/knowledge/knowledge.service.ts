import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateKnowledgeDto, userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const knowledge = await this.prisma.knowledge.create({
      data: { ...dto, createdBy_user: userId },
    });
    await this.notificationService.notifyAllUsers('Novo conhecimento cadastrado!', user?.companyId || undefined);
    return knowledge;
  }

  async findAll(includeDeleted = false, companyId?: number, allowAllSupport = false) {
    const whereBase: any = includeDeleted ? {} : { deleted_at: null };
    if (companyId && !allowAllSupport) {
      whereBase.createdBy = { companyId };
    }
    return this.prisma.knowledge.findMany({
      where: whereBase,
      include: { createdBy: true },
    });
  }

  async findOne(id: number, includeDeleted = false, companyId?: number, allowAllSupport = false) {
    const whereBase: any = includeDeleted ? { id } : { id, deleted_at: null };
    if (companyId && !allowAllSupport) {
      whereBase.createdBy = { companyId };
    }
    const knowledge = await this.prisma.knowledge.findFirst({
      where: whereBase,
      include: { createdBy: true },
    });
    if (!knowledge) throw new NotFoundException('Conhecimento não encontrado');
    return knowledge;
  }

  async remove(id: number) {
    const knowledge = await this.prisma.knowledge.findUnique({ where: { id } });
    if (!knowledge) throw new NotFoundException('Conhecimento não encontrado');
    return this.prisma.knowledge.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async update(id: number, dto: UpdateKnowledgeDto) {
    const knowledge = await this.prisma.knowledge.findUnique({ where: { id } });
    if (!knowledge) throw new NotFoundException('Conhecimento não encontrado');
    return this.prisma.knowledge.update({
      where: { id },
      data: {
        ...dto,
        updated_at: new Date(),
      },
    });
  }
}
