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

  // Método de criação de usuário
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    try {
      // Verificar se o email já existe no banco de dados
      const userExists = await this.userRepository.findOne({ where: { email: createUserDto.email } });
      if (userExists) {
        throw new BadRequestException('Já existe um usuário com este e-mail.');
      }

      // Criptografa a senha antes de salvar
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Cria um novo usuário com os dados recebidos
      const newUser = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });

      // Salva o usuário no banco de dados
      const savedUser = await this.userRepository.save(newUser);

      // Retorna os dados do usuário sem a senha
      const { password, ...result } = savedUser; 
      return result;
    } catch (error) {
      // Caso o email já esteja em uso ou outro erro, retorna um erro específico
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao cadastrar usuário. Tente novamente mais tarde.');
    }
  }

  // Método de login
  async login(email: string, password: string): Promise<{ token: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verifica se a senha fornecida é válida
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gera o token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, 'seu-segredo', { expiresIn: '1h' });
    return { token };
  }

  // Método para buscar um usuário pelo email
  async findByEmail(email: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { email } });
  }

  // Método para buscar um usuário pelo ID
  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
    return user;
  }
}