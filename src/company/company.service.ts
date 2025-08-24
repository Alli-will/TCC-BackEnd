import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompanyService {

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    const existing = await this.prisma.company.findUnique({
      where: { cnpj: dto.cnpj },
    });
    if (existing) {
      throw new Error('Já existe uma empresa cadastrada com esse CNPJ.');
    }
    const data = {
      ...dto,
      addressZipCode: Number(dto.addressZipCode),
      phone: dto.phone, // já vem digits only
    } as any;
    return this.prisma.company.create({ data });
  }

  async findAll() {
    return this.prisma.company.findMany();
  }

  async findOne(id: number) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    return company;
  }
}
