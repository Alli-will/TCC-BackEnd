import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
<<<<<<< HEAD
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DiaryEntry } from '../entity/Diary-entry.entity';
import { ReasonEmotion } from '../entity/reason-emotion.entity';
import { CreateDiaryEntryDto } from '../dto/Create-Diary-Entry-Dto';
import { NotificationService } from '../../notification/notification.service';
import { User, UserRole } from '../../user/entity/user.entity';
=======
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDiaryEntryDto } from '../dto/Create-Diary-Entry-Dto';
import { NotificationService } from '../../notification/notification.service';
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)

@Injectable()
export class DiaryService {
  constructor(
<<<<<<< HEAD
    @InjectRepository(DiaryEntry)
    private readonly diaryEntryRepository: Repository<DiaryEntry>,

    @InjectRepository(ReasonEmotion)
    private readonly reasonEmotionRepository: Repository<ReasonEmotion>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

=======
    private readonly prisma: PrismaService,
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    createDiaryEntryDto: CreateDiaryEntryDto,
    userId: number,
<<<<<<< HEAD
  ): Promise<DiaryEntry> {
    try {
      const { reasonIds, emotion, description, date } = createDiaryEntryDto;

      const reasons = await this.reasonEmotionRepository.findByIds(reasonIds);
=======
  ) {
    try {
      const { reasonIds, emotion, description, date } = createDiaryEntryDto;

      const reasons = await this.prisma.reasonEmotion.findMany({
        where: { id: { in: reasonIds } },
      });
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
      if (reasons.length !== reasonIds.length) {
        throw new BadRequestException('Um ou mais motivos são inválidos.');
      }

<<<<<<< HEAD
      const diaryEntry = this.diaryEntryRepository.create({
        date,
        emotion,
        description,
        user: { id: userId },
        reasons,
      });

      const savedEntry = await this.diaryEntryRepository.save(diaryEntry);

=======
      const diaryEntry = await this.prisma.diaryEntry.create({
        data: {
          date,
          emotion,
          description,
          user: { connect: { id: userId } },
          reasons: {
            connect: reasonIds.map(id => ({ id })),
          },
        },
        include: { reasons: true, user: true },
      });

>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
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
<<<<<<< HEAD
        const admins = await this.userRepository.find({
          where: { role: UserRole.ADMIN },
=======
        const admins = await this.prisma.user.findMany({
          where: { role: 'admin' },
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
        });

        for (const admin of admins) {
          await this.notificationService.createNotification(
            `Alerta: o usuário #${userId} registrou uma entrada com sinais de sofrimento.`,
            admin.id,
          );
        }
      }

<<<<<<< HEAD
      return savedEntry;
=======
      return diaryEntry;
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Erro ao criar entrada do diário.',
      );
    }
  }

<<<<<<< HEAD
  async findEntriesByUserId(userId: number): Promise<DiaryEntry[]> {
    return await this.diaryEntryRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'reasons'],
=======
  async findEntriesByUserId(userId: number) {
    return await this.prisma.diaryEntry.findMany({
      where: { userId },
      include: { user: true, reasons: true },
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
    });
  }

  async hasEntryToday(userId: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
<<<<<<< HEAD

    const entry = await this.diaryEntryRepository.findOne({
      where: {
        user: { id: userId },
        created_at: Between(today, new Date()),
=======
    const now = new Date();

    const entry = await this.prisma.diaryEntry.findFirst({
      where: {
        userId,
        created_at: {
          gte: today,
          lte: now,
        },
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
      },
    });

    return !!entry;
  }
}
