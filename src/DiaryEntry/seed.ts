import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { ReasonEmotion } from './entity/reason-emotion.entity';
import { DiaryEntry} from './entity/Diary-entry.entity';
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
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [ReasonEmotion, DiaryEntry, User, Company,Feed,Comment,Like,Notification,Department],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();

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

  const repo = AppDataSource.getRepository(ReasonEmotion);

  for (const reason of reasons) {
    const exists = await repo.findOne({ where: { reason } });
    if (!exists) {
      const newReason = repo.create({ reason });
      await repo.save(newReason);
    }
  }

  console.log('Seed finalizado.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Erro ao executar seed:', err);
  AppDataSource.destroy();
});
