import { Injectable, InternalServerErrorException, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user-dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken'; 

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    try {
      
      const userExists = await this.userRepository.findOne({ where: { email: createUserDto.email } });
      if (userExists) {
        throw new BadRequestException('Já existe um usuário com este e-mail.');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const newUser = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(newUser);

      const { password, ...result } = savedUser; 
      return result;
    } catch (error) {
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao cadastrar usuário. Tente novamente mais tarde.');
    }
  }

  async login(email: string, password: string): Promise<{ token: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { email: user.email, id: user.id };
    const token = jwt.sign(payload, 'masterkey', { expiresIn: '1h' });

    return { token };
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
    return user;
  }
}