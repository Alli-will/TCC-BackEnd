import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entity/company.entity';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Company])],
  providers: [CompanyService],
  controllers: [CompanyController],
  exports: [CompanyService,TypeOrmModule],
=======
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [CompanyService, PrismaService],
  controllers: [CompanyController],
  exports: [CompanyService],
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
})
export class CompanyModule {}
