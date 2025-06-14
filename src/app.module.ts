import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DiaryModule } from './DiaryEntry/Diary/diary.module';
import { FeedModule } from './Feed/feed.module';
// import { ConsultModule } from './consul/consult.module';
import { CompanyModule } from './company/company.module';
import { ReasonEmotionService } from './DiaryEntry/ReasonEmotion/reason-emotion.service';
import { ReasonEmotionController } from './DiaryEntry/ReasonEmotion/reason-emotion.controller';
import { ReasonEmotionModule } from './DiaryEntry/ReasonEmotion/reason-emotion.module';
import { NotificationModule } from './notification/notification.module';
import { DepartmentModule } from './department/department.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UserModule,
    AuthModule,
    DiaryModule,
    FeedModule,
    // ConsultModule,
    CompanyModule,
    ReasonEmotionModule,
    NotificationModule,
    DepartmentModule,
  ],
  controllers: [AppController, ReasonEmotionController],
  providers: [AppService, ReasonEmotionService],
})
export class AppModule {}
