import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from "./dto/department.dto";

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto, creatorUserId: number) {
    // Verifica se o usuário administrador existe
    const creatorUser = await this.prisma.user.findUnique({
      where: { id: creatorUserId },
      include: { company: true },
    });

    if (!creatorUser || !creatorUser.company) {
      throw new BadRequestException('Usuário não está vinculado a uma empresa.');
    }

    // Criação do departamento com a empresa associada
    return this.prisma.department.create({
      data: {
        name: createDepartmentDto.name,
        company: { connect: { id: creatorUser.company.id } },
      },
      include: { company: true },
    });
  }

  findAll() {
    return this.prisma.department.findMany({
      include: { company: true },
    });
  }
}
