import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/department.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../user/entity/user.entity';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';

@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard,RolesGuard)
  create(@Body() createDepartmentDto: CreateDepartmentDto, @Req() req: any) {
    const user = req.user as any;
    const companyId = user.company?.id;

    return this.departmentService.create(createDepartmentDto, companyId);
  }

  @Get()
  findAll() {
    return this.departmentService.findAll();
  }
}
