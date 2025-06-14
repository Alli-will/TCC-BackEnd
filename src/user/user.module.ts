import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
<<<<<<< HEAD
import { User } from './entity/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsUniqueEmailConstraint } from '../auth/unique-email.validator';
import { CompanyModule } from '../company/company.module';
import { Company } from '../company/entity/company.entity';
import { DepartmentModule } from '../department/department.module';
import { Department } from '../department/entity/department.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User,Company,Department]), CompanyModule,DepartmentModule],
  controllers: [UserController],
  providers: [UserService, IsUniqueEmailConstraint],
  exports: [UserService, TypeOrmModule]
=======
import { IsUniqueEmailConstraint } from '../auth/unique-email.validator';
import { CompanyModule } from '../company/company.module';
import { DepartmentModule } from '../department/department.module';
import { PrismaService } from '../../prisma/prisma.service'; // ajuste o caminho se necessário

@Module({
  imports: [CompanyModule, DepartmentModule],
  controllers: [UserController],
  providers: [UserService, IsUniqueEmailConstraint, PrismaService],
  exports: [UserService]
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
})
export class UserModule {}
