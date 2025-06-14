import { Injectable, NotFoundException } from '@nestjs/common';
<<<<<<< HEAD
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entity/company.entity';
=======
import { PrismaService } from '../../prisma/prisma.service';
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompanyService {
<<<<<<< HEAD
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async create(dto: CreateCompanyDto): Promise<Company> {
    const company = this.companyRepository.create(dto);
    return this.companyRepository.save(company);
  }

  async findAll(): Promise<Company[]> {
    return this.companyRepository.find();
  }

  async findOne(id: number): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });
=======
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    return this.prisma.company.create({ data: dto });
  }

  async findAll() {
    return this.prisma.company.findMany();
  }

  async findOne(id: number) {
    const company = await this.prisma.company.findUnique({ where: { id } });
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
    if (!company) throw new NotFoundException('Empresa não encontrada');
    return company;
  }
}
