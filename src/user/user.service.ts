import { Injectable, BadRequestException } from '@nestjs/common';
<<<<<<< HEAD
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user-dto';
import { Company } from '../company/entity/company.entity';
import { Department } from '../department/entity/department.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(Department) // Certifique-se de ter o repositório para Department
    private readonly departmentRepository: Repository<Department>,
  ) {}

  // Cadastro de acesso inicial (usuário administrador)
  async createAccessUser(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existinUser = await this.userRepository.findOne({
=======
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user-dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Cadastro de acesso inicial (usuário administrador)
  async createAccessUser(createUserDto: CreateUserDto) {
    const existinUser = await this.prisma.user.findUnique({
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
      where: { email: createUserDto.email },
    });
    if (existinUser) {
      throw new BadRequestException('Usuário já existe com esse e-mail.');
    }

<<<<<<< HEAD
    const company = await this.companyRepository.findOne({
=======
    const company = await this.prisma.company.findUnique({
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
      where: { id: createUserDto.companyId },
    });
    if (!company) {
      throw new BadRequestException('Empresa não encontrada.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

<<<<<<< HEAD
    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: UserRole.ADMIN,
      company,
      internal_id: 1, // Primeiro ID interno da empresa (admin)
    });

    const savedUser = await this.userRepository.save(newUser);
    const { password: _, ...result } = savedUser;
=======
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
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
    return result;
  }

  // Cadastro de colaborador vinculado à empresa do criador
<<<<<<< HEAD
  async create(createUserDto: CreateUserDto, creatorUserId: number): Promise<Omit<User, 'password'>> {
    const creator = await this.userRepository.findOne({
      where: { id: creatorUserId },
      relations: ['company'],
    });

=======
  async create(createUserDto: CreateUserDto, creatorUserId: number) {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorUserId },
      include: { company: true },
    });
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
    if (!creator || !creator.company) {
      throw new BadRequestException('Usuário não está vinculado a uma empresa.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Obter o último internal_id dessa empresa
<<<<<<< HEAD
    const lastUser = await this.userRepository.findOne({
      where: { company: { id: creator.company.id } },
      order: { internal_id: 'DESC' },
    });

    const nextInternalId = lastUser ? lastUser.internal_id + 1 : 1;

    const department = await this.departmentRepository.findOne({
      where: {
        id: createUserDto.departmentId,
        company: { id: creator.company.id },
      },
      relations: ['company'],
    });

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
      company: creator.company,
      internal_id: nextInternalId,
    });

    const savedUser = await this.userRepository.save(newUser);
    const { password: _, ...result } = savedUser;
    return result;
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find();
    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;
    const { password: _, ...result } = user;
    return result;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { email }, relations: ['company'] });
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    return user || null;
  }

  
=======
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
    if (!user) return null;
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
    return await this.prisma.user.findUnique({
      where: { id },
      include: { company: true },
    });
  }
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
}
