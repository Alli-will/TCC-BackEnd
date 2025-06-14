import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/entity/user.entity';
import { AuthModule } from './auth/auth.module';
import { DiaryModule } from './DiaryEntry/Diary/diary.module';
import { DiaryEntry } from './DiaryEntry/entity/Diary-entry.entity';
import { FeedModule} from './Feed/feed.module';
import { Feed } from './Feed/entity/feed.entity'
//import { ConsultModule } from './consul/consult.module';
//import { Consult } from './consul/entity/consult.entity';
import { Comment } from './Feed/entity/comment.entity';
import { Like } from './Feed/entity/like.entity';
import { Company } from './company/entity/company.entity';
import { CompanyModule } from './company/company.module';
import { ReasonEmotionService } from './DiaryEntry/ReasonEmotion/reason-emotion.service';
import { ReasonEmotionController } from './DiaryEntry/ReasonEmotion/reason-emotion.controller';
import { ReasonEmotionModule } from './DiaryEntry/ReasonEmotion/reason-emotion.module';
import { ReasonEmotion } from './DiaryEntry/entity/reason-emotion.entity';
import { Notification } from './notification/entity/notification.entity';
import { NotificationModule } from './notification/notification.module';
import { DepartmentModule } from './department/department.module';
import { Department } from './department/entity/department.entity';




@Module({
  imports: [
    ConfigModule.forRoot(),
      TypeOrmModule.forRootAsync({
        imports:[ConfigModule],
        useFactory: (configService: ConfigService) => ({
          type: 'postgres',
          url: configService.get<string>('DATABASE_URL'),
          entities: [User,DiaryEntry,Feed,/*Consult*/,Comment,Like,Company,ReasonEmotion,Notification,Department],
          synchronize: true,
          
        }),
        inject: [ConfigService],
    }), 
      UserModule,
      AuthModule,
      DiaryModule,
      FeedModule,
     // ConsultModule
      CompanyModule,
      ReasonEmotionModule,
      NotificationModule,
      DepartmentModule,
  ],
  controllers: [AppController, ReasonEmotionController],
  providers: [AppService, ReasonEmotionService],  
})

export class AppModule {}
