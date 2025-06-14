<<<<<<< HEAD
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { ReasonEmotion } from './entity/reason-emotion.entity';
import { DiaryEntry } from './entity/Diary-entry.entity';
import { User } from '../user/entity/user.entity';
import { Company } from '../company/entity/company.entity';
import { Feed } from '../Feed/entity/feed.entity';
import { Like } from '../Feed/entity/like.entity';
import { Comment } from '../Feed/entity/comment.entity';
import { Notification } from '../notification/entity/notification.entity';
import { Department } from '../department/entity/department.entity';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    ReasonEmotion,
    DiaryEntry,
    User,
    Company,
    Feed,
    Comment,
    Like,
    Notification,
    Department,
  ],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();

=======
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function seed() {
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
  const reasons = [
    'Trabalho',
    'Família',
    'Relacionamento',
    'Estudos',
    'Saúde',
    'Financeiro',
    'Amizades',
    'Outro',
  ];

<<<<<<< HEAD
  const repo = AppDataSource.getRepository(ReasonEmotion);

  for (const reason of reasons) {
    const exists = await repo.findOne({ where: { reason } });
    if (!exists) {
      const newReason = repo.create({ reason });
      await repo.save(newReason);
=======
  for (const reason of reasons) {
    const exists = await prisma.reasonEmotion.findUnique({ where: { reason } });
    if (!exists) {
      await prisma.reasonEmotion.create({ data: { reason } });
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
    }
  }

  console.log('Seed finalizado.');
<<<<<<< HEAD
  await AppDataSource.destroy();
=======
  await prisma.$disconnect();
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
}

seed().catch((err) => {
  console.error('Erro ao executar seed:', err);
<<<<<<< HEAD
  AppDataSource.destroy();
=======
  prisma.$disconnect();
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
});
