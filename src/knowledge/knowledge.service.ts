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
    const knowledge = await this.prisma.knowledge.create({
      data: {
        ...dto,
        createdBy_user: userId,
      },
    });
    // Notifica todos os usuários sobre o novo conhecimento
    await this.notificationService.notifyAllUsers('Novo conhecimento cadastrado!');
    return knowledge;
  }

  async findAll(includeDeleted = false) {
    return this.prisma.knowledge.findMany({
      where: includeDeleted ? undefined : { deleted_at: null },
      include: { createdBy: true },
    });
  }

  async findOne(id: number, includeDeleted = false) {
    const knowledge = await this.prisma.knowledge.findFirst({
      where: includeDeleted ? { id } : { id, deleted_at: null },
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
