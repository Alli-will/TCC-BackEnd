import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DiaryEntry } from '../entity/Diary-entry.entity';
import { ReasonEmotion } from '../entity/reason-emotion.entity';
import { CreateDiaryEntryDto } from '../dto/Create-Diary-Entry-Dto';
import { NotificationService } from '../../notification/notification.service';
import { User, UserRole } from '../../user/entity/user.entity';

@Injectable()
export class DiaryService {
  constructor(
    @InjectRepository(DiaryEntry)
    private readonly diaryEntryRepository: Repository<DiaryEntry>,

    @InjectRepository(ReasonEmotion)
    private readonly reasonEmotionRepository: Repository<ReasonEmotion>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly notificationService: NotificationService,
  ) {}

  async create(
    createDiaryEntryDto: CreateDiaryEntryDto,
    userId: number,
  ): Promise<DiaryEntry> {
    try {
      const { reasonIds, emotion, description, date } = createDiaryEntryDto;

      const reasons = await this.reasonEmotionRepository.findByIds(reasonIds);
      if (reasons.length !== reasonIds.length) {
        throw new BadRequestException('Um ou mais motivos são inválidos.');
      }

      const diaryEntry = this.diaryEntryRepository.create({
        date,
        emotion,
        description,
        user: { id: userId },
        reasons,
      });

      const savedEntry = await this.diaryEntryRepository.save(diaryEntry);

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
        const admins = await this.userRepository.find({
          where: { role: UserRole.ADMIN },
        });

        for (const admin of admins) {
          await this.notificationService.createNotification(
            `Alerta: o usuário #${userId} registrou uma entrada com sinais de sofrimento.`,
            admin.id,
          );
        }
      }

      return savedEntry;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Erro ao criar entrada do diário.',
      );
    }
  }

  async findEntriesByUserId(userId: number): Promise<DiaryEntry[]> {
    return await this.diaryEntryRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'reasons'],
    });
  }

  async hasEntryToday(userId: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entry = await this.diaryEntryRepository.findOne({
      where: {
        user: { id: userId },
        created_at: Between(today, new Date()),
      },
    });

    return !!entry;
  }
}
