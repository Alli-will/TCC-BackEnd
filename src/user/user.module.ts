import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
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
})
export class UserModule {}
