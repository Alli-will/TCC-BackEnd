import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DiaryEntry } from './entity/Diary.entity';
import { Repository } from 'typeorm';
import { CreateDiaryEntryDto } from './dto/Create-Diary-Entry-Dto';

@Injectable()
export class DiaryService {
  constructor(
    @InjectRepository(DiaryEntry)
    private readonly diaryEntryRepository: Repository<DiaryEntry>,
  ) {}


  async create(createDiaryEntryDto: CreateDiaryEntryDto, userId: number): Promise<DiaryEntry> {
    try {
      const diaryEntry = this.diaryEntryRepository.create({
        ...createDiaryEntryDto,
        user: { id: userId } 
      });
      return await this.diaryEntryRepository.save(diaryEntry);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao criar entrada do diário.');
    }
  }

  async findEntriesByUserId(userId: number): Promise<DiaryEntry[]> {
    return await this.diaryEntryRepository.find({
      where: { user: { id: userId } },
      relations: ['user'], 
    });
}
}