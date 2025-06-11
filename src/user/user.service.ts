import { Injectable, BadRequestException } from '@nestjs/common';
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
      where: { email: createUserDto.email },
    });
    if (existinUser) {
      throw new BadRequestException('Usuário já existe com esse e-mail.');
    }

    const company = await this.companyRepository.findOne({
      where: { id: createUserDto.companyId },
    });
    if (!company) {
      throw new BadRequestException('Empresa não encontrada.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: UserRole.ADMIN,
      company,
      internal_id: 1, // Primeiro ID interno da empresa (admin)
    });

    const savedUser = await this.userRepository.save(newUser);
    const { password: _, ...result } = savedUser;
    return result;
  }

  // Cadastro de colaborador vinculado à empresa do criador
  async create(createUserDto: CreateUserDto, creatorUserId: number): Promise<Omit<User, 'password'>> {
    const creator = await this.userRepository.findOne({
      where: { id: creatorUserId },
      relations: ['company'],
    });

    if (!creator || !creator.company) {
      throw new BadRequestException('Usuário não está vinculado a uma empresa.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Obter o último internal_id dessa empresa
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

  
}
