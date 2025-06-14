import { Module, forwardRef } from '@nestjs/common';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { CompanyModule } from '../company/company.module';
import { UserModule } from '../user/user.module';
import { PrismaService } from '../../prisma/prisma.service'; // ajuste o caminho se necessário


@Module({
  imports: [CompanyModule, forwardRef(() => UserModule)],
  controllers: [DepartmentController],
  providers: [DepartmentService, PrismaService],
  exports: [DepartmentService],
})
export class DepartmentModule {}
