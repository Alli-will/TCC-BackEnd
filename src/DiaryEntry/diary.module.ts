import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryEntry } from './entity/Diary.entity';
import { DiaryService } from './diary.service';
import { DiaryController } from './diary.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([DiaryEntry]),UserModule], // Registrar a entidade DiaryEntry
  controllers: [DiaryController],
  providers: [DiaryService],
  exports: [DiaryService],
})
export class DiaryModule {}