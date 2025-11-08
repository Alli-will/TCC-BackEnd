import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { IsUniqueEmailConstraint } from '../auth/unique-email.validator';
import { CompanyModule } from '../company/company.module';
import { DepartmentModule } from '../department/department.module';
import { PrismaService } from '../../prisma/prisma.service'; // ajuste o caminho se necessário

@Module({
  imports: [CompanyModule, DepartmentModule],
  controllers: [UserController],
  providers: [UserService, IsUniqueEmailConstraint, PrismaService],
  exports: [UserService],
})
export class UserModule {}
