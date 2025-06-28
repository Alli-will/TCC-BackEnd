import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DiaryModule } from './DiaryEntry/Diary/diary.module';
import { CompanyModule } from './company/company.module';
import { ReasonEmotionService } from './DiaryEntry/ReasonEmotion/reason-emotion.service';
import { ReasonEmotionController } from './DiaryEntry/ReasonEmotion/reason-emotion.controller';
import { ReasonEmotionModule } from './DiaryEntry/ReasonEmotion/reason-emotion.module';
import { NotificationModule } from './notification/notification.module';
import { DepartmentModule } from './department/department.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { SupportMaterialModule } from './support-material/support-material.module';
import { BehavioralAnalysisModule } from './behavioral-analysis/behavioral-analysis.module';
import { DashboardModule } from './Dashboard/dashboard.module';
import { DiaryInsightsModule } from './DiaryEntry/metrics/diary-insights.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UserModule,
    AuthModule,
    DiaryModule,
    CompanyModule,
    ReasonEmotionModule,
    NotificationModule,
    DepartmentModule,
    KnowledgeModule,
    SupportMaterialModule,
    BehavioralAnalysisModule,
    DashboardModule,
    DiaryInsightsModule,
    DashboardModule
  ],
  controllers: [AppController, ReasonEmotionController],
  providers: [AppService, ReasonEmotionService],
})
export class AppModule {}
