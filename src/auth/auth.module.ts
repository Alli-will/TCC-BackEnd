import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { DiaryService } from './diary/diary.service';

@Module({
  imports: [UserModule, PassportModule], 
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, DiaryService],
})
export class AuthModule {}
