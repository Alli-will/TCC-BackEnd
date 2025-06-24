import {Controller,Post,Body,HttpCode,HttpStatus,Req,UseGuards,Get,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user-dto';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/roles.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('register-access')
  @HttpCode(HttpStatus.CREATED)
  async registerAccess(@Body() createUserDto: CreateUserDto) {
    try {
      const createdUser = await this.userService.createAccessUser(createUserDto);
      return {
        message: 'Usuário (acesso) criado com sucesso!',
        user: createdUser,
      };
    } catch (error) {
      return {
        message: 'Erro ao criar usuário de acesso.',
        error: error.response || error.message,
      };
    }
  }
  @Post('create-collaborator')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  async createCollaborator(@Body() createUserDto: CreateUserDto, @Req() req) {
    //console.log('DTO no controller:', dto);
    console.log('Usuário autenticado:', req.user);
    try {
      const creatorUser = req.user;
      const companyId = creatorUser.companyId;
      if (!companyId) {
        return {
          message: 'Usuário não está vinculado a nenhuma empresa.',
        };
      }

      const createdUser = await this.userService.create(createUserDto, creatorUser.id);

      return {
        message: 'Colaborador cadastrado com sucesso!',
        user: createdUser,
      };
    } catch (error) {
      return {
        message: 'Erro ao cadastrar colaborador.',
        error: error.response || error.message,
      };
    }
  }
  @Get()
  async findAll() {
    return this.userService.findAll();
  }
}
