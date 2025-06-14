import { Module, forwardRef } from '@nestjs/common';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
<<<<<<< HEAD
import { Department } from './entity/department.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyService } from 'src/company/company.service';
import { CompanyController } from 'src/company/company.controller';
import { CompanyModule } from '../company/company.module';
import { UserModule } from '../user/user.module';


@Module({
  imports: [TypeOrmModule.forFeature([Department]),
  CompanyModule, forwardRef(() => UserModule)],
  controllers: [DepartmentController],
  providers: [DepartmentService],
=======
import { CompanyModule } from '../company/company.module';
import { UserModule } from '../user/user.module';
import { PrismaService } from '../../prisma/prisma.service'; // ajuste o caminho se necessário


@Module({
  imports: [CompanyModule, forwardRef(() => UserModule)],
  controllers: [DepartmentController],
  providers: [DepartmentService, PrismaService],
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
  exports: [DepartmentService],
})
export class DepartmentModule {}
