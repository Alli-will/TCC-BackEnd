import { DataSource } from 'typeorm';
import 'dotenv/config';

import { User } from './user/entity/user.entity';
import { DiaryEntry } from './DiaryEntry/entity/Diary-entry.entity';
import { Feed } from './Feed/entity/feed.entity';
import { Comment } from './Feed/entity/comment.entity';
import { Like } from './Feed/entity/like.entity';
import { Company } from './company/entity/company.entity';
import { ReasonEmotion } from './DiaryEntry/entity/reason-emotion.entity';
import { Notification } from './notification/entity/notification.entity';
import { Department } from './department/entity/department.entity';

const ormconfig = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    DiaryEntry,
    Feed,
    Comment,
    Like,
    Company,
    ReasonEmotion,
    Notification,
    Department,
  ],
  migrations: [__dirname + '/migration/*{.ts,.js}'],
  synchronize: false,
  logging: false,
});

export default ormconfig;
