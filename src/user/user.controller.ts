import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user-dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED) // Define o código de status HTTP 201 (Criado)
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      const createdUser = await this.userService.create(createUserDto);
      return {
        message: 'Usuário Cadastrado com Sucesso!!',
        user: createdUser, // Retorna os dados do usuário sem a senha
      };
    } catch (error) {
      return {
        message: 'Erro ao cadastrar usuário. Tente novamente mais tarde.',
        error: error.response || error.message,
      };
    }
  }
}