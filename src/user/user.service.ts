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

    const lastCompanyUser = await this.prisma.user.findFirst({
      where: { companyId: company.id },
      orderBy: { internal_id: 'desc' },
    });
    const nextInternal = lastCompanyUser
      ? (lastCompanyUser.internal_id || 0) + 1
      : 1;
    const newUser = await this.prisma.user.create({
      data: {
        ...(({ companyId, departmentId, ...rest }) => rest)(createUserDto),
        password: hashedPassword,
        role: 'admin',
        company: { connect: { id: company.id } },
        internal_id: nextInternal,
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
      throw new BadRequestException(
        'Usuário não está vinculado a uma empresa.',
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const lastCompanyUser = await this.prisma.user.findFirst({
      where: { companyId: creator.company.id },
      orderBy: { internal_id: 'desc' },
    });
    const nextInternalId = lastCompanyUser
      ? (lastCompanyUser.internal_id || 0) + 1
      : 1;

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
        throw new BadRequestException(
          'Departamento não encontrado para esta empresa.',
        );
      }
    }

    const newUser = await this.prisma.user.create({
      data: {
        ...(({ companyId, departmentId, ...rest }) => rest)(createUserDto),
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
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });
    if (!admin) {
      throw new BadRequestException('Administrador não encontrado.');
    }
    const existing = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existing)
      throw new BadRequestException('Já existe usuário com esse e-mail.');
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    // internal_id independente de empresa para suporte: usar maior global
    const lastUser = await this.prisma.user.findFirst({
      orderBy: { internal_id: 'desc' },
    });
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
      } as any, // cast para permitir ausência de company enquanto schema gerado não atualiza
    });
    const { password, ...result } = newUser;
    return result;
  }

  async findAll(
    companyId?: number,
    allowAllSupport = false,
    status: 'ativos' | 'inativos' | 'todos' = 'ativos',
  ) {
    const where: any = { role: { not: 'support' as any } };
    if (companyId) where.companyId = companyId;
    // Se for suporte com allowAllSupport true, não filtra por role
    if (allowAllSupport) delete where.role;
    // Status filter: por padrão somente ativos
    if (status === 'ativos') where.ativo = true;
    else if (status === 'inativos') where.ativo = false;
    const users: any[] = await this.prisma.user.findMany({
      where,
      orderBy: { internal_id: 'asc' },
      select: {
        id: true,
        internal_id: true,
        first_Name: true,
        last_Name: true,
        email: true,
        role: true,
        created_at: true,
        ativo: true,
        companyId: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
      },
    });
    return users.map((u: any) => ({
      id: u.id,
      internal_id: u.internal_id,
      first_Name: u.first_Name,
      last_Name: u.last_Name,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      ativo: u.ativo,
      companyId: u.companyId,
      departmentId: u.departmentId,
      department: u.department ? u.department.name : null,
    }));
  }

  async findOne(id: number) {
    const user: any = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        internal_id: true,
        first_Name: true,
        last_Name: true,
        email: true,
        role: true,
        created_at: true,
        companyId: true,
        departmentId: true,
        // sem password e sem avatar
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });
    if (!user) throw new BadRequestException('Usuário não encontrado.');
    return user;
  }

  async findByEmail(email: string) {
    // Para autenticação precisamos da senha; não incluir avatar
    return await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        internal_id: true,
        first_Name: true,
        last_Name: true,
        email: true,
        role: true,
        created_at: true,
        companyId: true,
        departmentId: true,
        ativo: true,
        password: true,
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        internal_id: true,
        first_Name: true,
        last_Name: true,
        email: true,
        role: true,
        created_at: true,
        companyId: true,
        departmentId: true,
        ativo: true,
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });
    if (!user) return null;
    return user as any;
  }

  async findByIdWithAvatar(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        avatar: true,
        avatarMimeType: true,
      },
    });
  }

  async findCompanyAvatars(companyId: number) {
    return this.prisma.user.findMany({
      where: { companyId, avatar: { not: null } },
      select: { id: true, avatar: true, avatarMimeType: true },
    });
  }

  private isValidImage(buffer: Buffer, mime?: string | null): boolean {
    if (!buffer || buffer.length < 8) return false;
    const sig = buffer.subarray(0, 12);
    const hex = Array.from(sig)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
      return true;
    // PNG
    if (hex.startsWith('89 50 4e 47 0d 0a 1a 0a')) return true;
    // GIF
    if (
      sig[0] === 0x47 &&
      sig[1] === 0x49 &&
      sig[2] === 0x46 &&
      sig[3] === 0x38
    )
      return true;
    // WEBP (RIFF....WEBP)
    if (
      sig[0] === 0x52 &&
      sig[1] === 0x49 &&
      sig[2] === 0x46 &&
      sig[3] === 0x46 &&
      sig[8] === 0x57 &&
      sig[9] === 0x45 &&
      sig[10] === 0x42 &&
      sig[11] === 0x50
    )
      return true;
    // Fallback: if declared mime is image/* and size > 100 bytes accept
    if (mime && mime.startsWith('image/') && buffer.length > 100) return true;
    return false;
  }

  async sanitizeCorruptedAvatars(companyId: number) {
    const users = await this.prisma.user.findMany({
      where: { companyId, avatar: { not: null } },
      select: { id: true, avatar: true, avatarMimeType: true },
    });
    const results: any[] = [];
    for (const u of users as any[]) {
      const buf: Buffer | null = u.avatar as Buffer | null;
      if (!buf) continue;
      const valid = this.isValidImage(buf, u.avatarMimeType);
      if (!valid) {
        await this.prisma.user.update({
          where: { id: u.id },
          data: { avatar: null, avatarMimeType: null },
        });
        results.push({ id: u.id, action: 'cleared', size: buf.length });
      } else {
        results.push({ id: u.id, action: 'kept', size: buf.length });
      }
    }
    return results;
  }

  async updateUser(id: number, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('Usuário não encontrado.');
    const updateData: any = {};
    if (data.first_Name || data.firstName)
      updateData.first_Name = data.first_Name || data.firstName;
    if (data.last_Name || data.lastName)
      updateData.last_Name = data.last_Name || data.lastName;
    if (data.email) updateData.email = data.email;
    if (data.avatar && data.avatar instanceof Buffer)
      updateData.avatar = data.avatar;
    if (data.avatarMimeType) updateData.avatarMimeType = data.avatarMimeType;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
      const { password, avatar, avatarMimeType, ...rest } = updated as any;
      return rest;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async getUserAvatar(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateDepartment(
    targetUserId: number,
    departmentId: number | null,
    adminUserId: number,
  ) {
    // verifica admin e empresa
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });
    if (!admin) throw new BadRequestException('Administrador não encontrado');
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) throw new BadRequestException('Usuário alvo não encontrado');
    if (admin.companyId !== target.companyId) {
      throw new BadRequestException('Usuário não pertence à mesma empresa');
    }
    let deptConnect: any = undefined;
    if (departmentId) {
      const dept = await this.prisma.department.findFirst({
        where: { id: departmentId, companyId: admin.companyId },
      });
      if (!dept) throw new BadRequestException('Departamento inválido');
      deptConnect = { connect: { id: dept.id } };
    } else {
      // remover departamento
      deptConnect = { disconnect: true };
    }
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { department: deptConnect },
      include: { department: true },
    });
    const { password, avatar, avatarMimeType, department, ...rest } =
      updated as any;
    return {
      ...rest,
      department: department ? department.name : null,
      departmentId: department ? department.id : null,
    };
  }

  async updateRole(
    targetUserId: number,
    dto: UpdateUserRoleDto,
    requesterId: number,
  ) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });
    if (!requester)
      throw new BadRequestException('Usuário solicitante não encontrado');
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) throw new BadRequestException('Usuário alvo não encontrado');

    const isSupport = requester.role === 'support';
    const isAdmin = requester.role === 'admin';
    if (!isSupport && !isAdmin)
      throw new BadRequestException('Sem permissão para alterar role');

    // Admin só pode alterar dentro da sua empresa
    if (isAdmin && requester.companyId !== target.companyId) {
      throw new BadRequestException(
        'Administrador não pode alterar usuário de outra empresa',
      );
    }

    // Proteções básicas
    if (requester.id === targetUserId && dto.role !== requester.role) {
      throw new BadRequestException(
        'Não é permitido mudar o próprio papel desta forma.',
      );
    }

    // Regras: suporte pode promover/demover para admin/employee, não cria outro suporte aqui
    if (dto.role === 'support') {
      throw new BadRequestException(
        'Uso de role support não permitido por esta rota',
      );
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id: targetUserId },
        data: { role: dto.role as PrismaUserRole },
      });
      const { password, avatar, avatarMimeType, ...rest } = updated as any;
      return rest;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async setActive(userId: number, active: boolean, requesterId: number) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });
    if (!requester) throw new BadRequestException('Solicitante não encontrado');
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new BadRequestException('Usuário alvo não encontrado');
    if (requester.role !== 'admin' && requester.role !== 'support') {
      throw new BadRequestException('Sem permissão');
    }
    // Admin só altera dentro da própria empresa
    if (
      requester.role === 'admin' &&
      requester.companyId !== target.companyId
    ) {
      throw new BadRequestException('Fora do escopo da empresa');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { ativo: active },
    });
    const { password, avatar, avatarMimeType, ...rest } = updated as any;
    return rest;
  }

  async safeDelete(userId: number, requesterId: number) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });
    if (!requester) throw new BadRequestException('Solicitante não encontrado');
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new BadRequestException('Usuário alvo não encontrado');
    if (requester.role !== 'admin' && requester.role !== 'support') {
      throw new BadRequestException('Sem permissão');
    }
    if (
      requester.role === 'admin' &&
      requester.companyId !== target.companyId
    ) {
      throw new BadRequestException('Fora do escopo da empresa');
    }
    // Verificar registros vinculados: respostas de pulso/clima, diário, notificações
    const counts = await this.prisma.$transaction([
      this.prisma.pulseResponse.count({ where: { userId: userId } }),
      this.prisma.climaResponse.count({ where: { userId: userId } }),
      this.prisma.notification.count({ where: { userId: userId } }),
    ]);
    const total = counts.reduce((a, b) => a + b, 0);
    if (total > 0) {
      throw new BadRequestException(
        'Não é possível excluir: usuário possui registros no sistema. Inative-o.',
      );
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
  }
}
