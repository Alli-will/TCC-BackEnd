import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';


@Module({
  imports: [PassportModule,
    JwtModule.register({
    secret:'masterkey',
    signOptions: { expiresIn: '1h' }, 
  }),UserModule,
], 
  controllers: [AuthController],
  providers: [PrismaService,AuthService, JwtStrategy, ],
})
export class AuthModule {}
