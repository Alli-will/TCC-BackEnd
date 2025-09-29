import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

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
      phone: dto.phone, 
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

  async update(id: number, dto: UpdateCompanyDto) {
    const exists = await this.prisma.company.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Empresa não encontrada');

    const data: any = { ...dto };
    if (dto.addressZipCode) data.addressZipCode = Number(dto.addressZipCode);
    // phone e cnpj já chegam como string de dígitos
    return this.prisma.company.update({ where: { id }, data });
  }
}
