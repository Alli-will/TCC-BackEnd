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

  async update(id: number, body: { name: string }, updaterUserId: number) {
    const updater = await this.prisma.user.findUnique({ where: { id: updaterUserId } });
    if (!updater || !updater.companyId) throw new BadRequestException('Usuário não vinculado a empresa.');
    // Garante escopo da empresa
    const existing = await this.prisma.department.findFirst({ where: { id, companyId: updater.companyId } });
    if (!existing) throw new BadRequestException('Departamento não encontrado.');
    return this.prisma.department.update({ where: { id }, data: { name: body?.name ?? existing.name } });
  }

  async remove(id: number, removerUserId: number) {
    const remover = await this.prisma.user.findUnique({ where: { id: removerUserId } });
    if (!remover || !remover.companyId) throw new BadRequestException('Usuário não vinculado a empresa.');
    const existing = await this.prisma.department.findFirst({ where: { id, companyId: remover.companyId } });
    if (!existing) throw new BadRequestException('Departamento não encontrado.');
    // Opcional: impedir remoção se houver usuários vinculados
    const usersCount = await this.prisma.user.count({ where: { departmentId: id } });
    if (usersCount > 0) {
      throw new BadRequestException('Não é possível excluir: há usuários vinculados a este departamento.');
    }
    return this.prisma.department.delete({ where: { id } });
  }
}
