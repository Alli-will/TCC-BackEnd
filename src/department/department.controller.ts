import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/department.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
<<<<<<< HEAD
import { UserRole } from '../user/entity/user.entity';
=======
import { UserRole } from '../auth/roles.decorator';
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
import { JwtAuthGuard } from '../auth/JwtAuthGuard';

@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard,RolesGuard)
  create(@Body() createDepartmentDto: CreateDepartmentDto, @Req() req: any) {
    const user = req.user as any;
<<<<<<< HEAD
    const companyId = user.company?.id;

    return this.departmentService.create(createDepartmentDto, companyId);
=======
    const userId = user.id;

    return this.departmentService.create(createDepartmentDto, userId);
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
  }

  @Get()
  findAll() {
    return this.departmentService.findAll();
  }
}
