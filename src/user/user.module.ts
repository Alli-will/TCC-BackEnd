import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entity/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsUniqueEmailConstraint } from 'src/auth/unique-email.validator';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, IsUniqueEmailConstraint],
  exports: [UserService, TypeOrmModule]
})
export class UserModule {}
