import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user-dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Cadastro de acesso inicial (usuário administrador)
  async createAccessUser(createUserDto: CreateUserDto) {
    const existinUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existinUser) {
      throw new BadRequestException('Usuário já existe com esse e-mail.');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: createUserDto.companyId },
    });
    if (!company) {
      throw new BadRequestException('Empresa não encontrada.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        // Remove companyId e departmentId do DTO para evitar conflito com connect
        ...((({ companyId, departmentId, ...rest }) => rest)(createUserDto)),
        password: hashedPassword,
        role: 'admin',
        company: { connect: { id: company.id } },
        internal_id: 1,
      },
    });
    const { password, ...result } = newUser;
    return result;
  }

  // Cadastro de colaborador vinculado à empresa do criador
  async create(createUserDto: CreateUserDto, creatorUserId: number) {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorUserId },
      include: { company: true },
    });
    if (!creator || !creator.company) {
      throw new BadRequestException('Usuário não está vinculado a uma empresa.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Obter o último internal_id dessa empresa
    const lastUser = await this.prisma.user.findFirst({
      where: { companyId: creator.company.id },
      orderBy: { internal_id: 'desc' },
    });
    const nextInternalId = lastUser ? lastUser.internal_id + 1 : 1;

    // Verifica se o departamento existe e pertence à empresa
    let department = null;
    if (createUserDto.departmentId) {
      department = await this.prisma.department.findFirst({
        where: {
          id: createUserDto.departmentId,
          companyId: creator.company.id,
        },
      });
      if (!department) {
        throw new BadRequestException('Departamento não encontrado para esta empresa.');
      }
    }

    const newUser = await this.prisma.user.create({
      data: {
        // Remove companyId e departmentId do DTO para evitar conflito com connect
        ...((({ companyId, departmentId, ...rest }) => rest)(createUserDto)),
        password: hashedPassword,
        role: 'employee',
        company: { connect: { id: creator.company.id } },
        internal_id: nextInternalId,
        department: department ? { connect: { id: department.id } } : undefined,
      },
    });
    const { password, ...result } = newUser;
    return result;
  }

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('Usuário não encontrado.');
    const { password, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { company: true },
    });
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }
}
