import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user-dto';
// Alias Prisma enum to avoid confusion with auth UserRole enum
import { UserRole as PrismaUserRole } from '@prisma/client';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

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

  async createSupport(createUserDto: CreateUserDto, adminUserId: number) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin) {
      throw new BadRequestException('Administrador não encontrado.');
    }
    const existing = await this.prisma.user.findUnique({ where: { email: createUserDto.email } });
    if (existing) throw new BadRequestException('Já existe usuário com esse e-mail.');
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    // internal_id independente de empresa para suporte: usar maior global
    const lastUser = await this.prisma.user.findFirst({ orderBy: { internal_id: 'desc' } });
    const nextInternalId = lastUser ? (lastUser.internal_id || 0) + 1 : 1;
    const newUser = await this.prisma.user.create({
      data: {
        first_Name: createUserDto.first_Name,
        last_Name: createUserDto.last_Name,
        email: createUserDto.email,
        password: hashedPassword,
        role: 'support' as PrismaUserRole,
        internal_id: nextInternalId,
        // companyId omitido (null)
      } as any // cast para permitir ausência de company enquanto schema gerado não atualiza
    });
    const { password, ...result } = newUser;
    return result;
  }

  async findAll() {
    const users: any[] = await this.prisma.user.findMany({
      where: { role: { not: 'support' as any } }, // excluir suporte das listagens
      include: { department: true }
    });
    return users.map((u: any) => {
      const { password, department, ...user } = u;
      return {
        ...user,
        department: department ? department.name : null,
        departmentId: department ? department.id : null,
        role: user.role
      };
    });
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

  async updateUser(id: number, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('Usuário não encontrado.');
    const updateData: any = {};
    if (data.first_Name || data.firstName) updateData.first_Name = data.first_Name || data.firstName;
    if (data.last_Name || data.lastName) updateData.last_Name = data.last_Name || data.lastName;
    if (data.email) updateData.email = data.email;
  if (data.avatar && data.avatar instanceof Buffer) updateData.avatar = data.avatar;
  if (data.avatarMimeType) updateData.avatarMimeType = data.avatarMimeType;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
  try {
      const updated = await this.prisma.user.update({ where: { id }, data: updateData });
      const { password, ...rest } = updated;
      return rest;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async getUserAvatar(id: number) {
  return this.prisma.user.findUnique({ where: { id } });
  }

  async updateDepartment(targetUserId: number, departmentId: number | null, adminUserId: number) {
    // verifica admin e empresa
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin) throw new BadRequestException('Administrador não encontrado');
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new BadRequestException('Usuário alvo não encontrado');
    if (admin.companyId !== target.companyId) {
      throw new BadRequestException('Usuário não pertence à mesma empresa');
    }
    let deptConnect: any = undefined;
    if (departmentId) {
      const dept = await this.prisma.department.findFirst({ where: { id: departmentId, companyId: admin.companyId } });
      if (!dept) throw new BadRequestException('Departamento inválido');
      deptConnect = { connect: { id: dept.id } };
    } else {
      // remover departamento
      deptConnect = { disconnect: true };
    }
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { department: deptConnect },
      include: { department: true }
    });
    const { password, department, ...rest } = updated as any;
    return { ...rest, department: department ? department.name : null, departmentId: department ? department.id : null };
  }

  async updateRole(targetUserId: number, dto: UpdateUserRoleDto, adminUserId: number) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin) throw new BadRequestException('Administrador não encontrado');
    if (admin.role !== 'admin') throw new BadRequestException('Apenas administrador pode alterar role');
    if (admin.id === targetUserId && dto.role !== 'admin') {
      throw new BadRequestException('Você não pode remover seu próprio papel de administrador.');
    }
    try {
      const updated = await this.prisma.user.update({ where: { id: targetUserId }, data: { role: dto.role as PrismaUserRole } });
      const { password, ...rest } = updated;
      return rest;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
