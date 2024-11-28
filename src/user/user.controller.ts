import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user-dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED) 
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      const createdUser = await this.userService.create(createUserDto);
      return {
        message: 'Usuário Cadastrado com Sucesso!!',
        user: createdUser, 
      };
    } catch (error) {
      return {
        message: 'Erro ao cadastrar usuário. Tente novamente mais tarde.',
        error: error.response || error.message,
      };
    }
  }
}