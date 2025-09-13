import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
// Diário removido
import { CompanyModule } from './company/company.module';
// ReasonEmotion removido
import { NotificationModule } from './notification/notification.module';
import { DepartmentModule } from './department/department.module';
// import { KnowledgeModule } from './knowledge/knowledge.module';
// import { SupportMaterialModule } from './support-material/support-material.module';
import { DashboardModule } from './Dashboard/dashboard.module';
// DiaryInsights removido
import { SearchModule } from './search/search.module';
import { QuestionModule } from './question/question.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UserModule,
    AuthModule,
  // DiaryModule,
    CompanyModule,
  // ReasonEmotionModule,
    NotificationModule,
    DepartmentModule,
  // KnowledgeModule,
  // SupportMaterialModule,
  DashboardModule,
  // DiaryInsightsModule,
  SearchModule,
  QuestionModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
