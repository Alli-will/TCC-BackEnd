import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDiaryEntryDto } from './dto/Create-Diary-Entry-Dto';
import { NotificationService } from '../../notification/notification.service';

@Injectable()
export class DiaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    createDiaryEntryDto: CreateDiaryEntryDto,
    userId: number,
  ) {
    try {
      const { reasonIds, emotion, description, date } = createDiaryEntryDto;

      const reasons = await this.prisma.reasonEmotion.findMany({
        where: { id: { in: reasonIds } },
      });
      if (reasons.length !== reasonIds.length) {
        throw new BadRequestException('Um ou mais motivos são inválidos.');
      }

      const diaryEntry = await this.prisma.diaryEntry.create({
        data: {
          date: new Date(date), // Garante formato ISO-8601
          emotion,
          description,
          user: { connect: { id: userId } },
          reasons: {
            connect: reasonIds.map(id => ({ id })),
          },
        },
        include: { reasons: true, user: true },
      });

      // ---- DETECÇÃO DE ALERTA ----
      const palavrasChave = ['cansaço', 'exausto', 'desanimado', 'sobrecarregado'];
      const motivosSensíveis = ['trabalho'];
      const emocoesNegativas = ['tristeza', 'ansiedade', 'depressão'];

      const descricaoLower = description.toLowerCase();
      const hasPalavraChave = palavrasChave.some(p => descricaoLower.includes(p));
      const hasMotivoSensivel = reasons.some(r =>
        motivosSensíveis.includes(r.reason.toLowerCase()),
      );
      const isEmocaoNegativa = emocoesNegativas.includes(emotion.toLowerCase());

      if (hasPalavraChave && hasMotivoSensivel && isEmocaoNegativa) {
        // Busca o departamento do usuário
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { department: true },
        });
        const departamento = user?.department?.name || 'Desconhecido';
        const admins = await this.prisma.user.findMany({
          where: { role: 'admin' },
        });

        for (const admin of admins) {
          await this.notificationService.createNotification(
            `Alerta: um colaborador do departamento ${departamento} registrou uma entrada com sinais de sofrimento.`,
            admin.id,
          );
        }
      }

      return diaryEntry;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Erro ao criar entrada do diário.',
      );
    }
  }

  async findEntriesByUserId(userId: number) {
    return await this.prisma.diaryEntry.findMany({
      where: { userId },
      include: { user: true, reasons: true },
    });
  }

  async hasEntryToday(userId: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    const entry = await this.prisma.diaryEntry.findFirst({
      where: {
        userId,
        created_at: {
          gte: today,
          lte: now,
        },
      },
    });

    return !!entry;
  }
}
