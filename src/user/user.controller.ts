import {Controller,Post,Body,HttpCode,HttpStatus,Req,UseGuards,Get, Query, Put, UploadedFile, UseInterceptors, Res, Param} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user-dto';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/roles.decorator';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    try {
      const users = await this.userService.findAll();
      return users;
    } catch (error) {
      return {
        message: 'Erro ao buscar usuários.',
        error: error.response || error.message,
      };
    }
  }
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
      // Se for erro de validação, retorna detalhes
      if (error.getResponse && typeof error.getResponse === 'function') {
        const response = error.getResponse();
        if (response && response.message) {
          return {
            message: 'Erro ao criar usuário de acesso.',
            details: response.message,
          };
        }
      }
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

  @Post('create-support')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  async createSupport(@Body() createUserDto: CreateUserDto, @Req() req) {
    try {
      const creatorUser = req.user;
      const companyId = creatorUser.companyId;
      if (!companyId) {
        return { message: 'Administrador não vinculado a empresa.' };
      }
      // Força role suporte no service via campo adicional
  const supportUser = await this.userService.createSupport(createUserDto, creatorUser.id);
  return { message: 'Usuário de support criado com sucesso!', user: supportUser };
    } catch (error) {
  return { message: 'Erro ao criar usuário de support.', error: error.response || error.message };
    }
  }

  @Get('by-email')
  @UseGuards(JwtAuthGuard)
  async getByEmail(@Query('email') email: string) {
    if (!email) {
      return { message: 'Parâmetro email é obrigatório' };
    }
    const user = await this.userService.findByEmail(email);
    if (!user) return { message: 'Usuário não encontrado' };
    const { password, ...rest } = user;
    return rest;
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Body() body: any, @Req() req) {
    try {
      const updated = await this.userService.updateUser(req.user.id, body);
      return { message: 'Perfil atualizado', user: updated };
    } catch (error) {
      return { message: 'Erro ao atualizar perfil', error: error.response || error.message };
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req) {
    const user = await this.userService.findById(req.user.id);
    return user;
  }

  @Get('me/avatar')
  @UseGuards(JwtAuthGuard)
  async getMyAvatar(@Req() req, @Res() res: Response) {
  const user = await this.userService.findById(req.user.id) as any;
  if (!user || !user.avatar) return res.status(404).send('Sem avatar');
  const buf: Buffer = user.avatar as Buffer;
  res.setHeader('Content-Type', user.avatarMimeType || 'image/png');
  res.setHeader('Content-Length', buf.length.toString());
  res.setHeader('Cache-Control', 'no-store');
  return res.end(buf);
  }

  @Get('me/avatar/base64')
  @UseGuards(JwtAuthGuard)
  async getMyAvatarBase64(@Req() req) {
    const user = await this.userService.findById(req.user.id) as any;
    if (!user || !user.avatar) return { hasAvatar: false };
    const buf: Buffer = user.avatar as Buffer;
    return {
      hasAvatar: true,
      mimeType: user.avatarMimeType || 'image/png',
      base64: buf.toString('base64')
    };
  }

  @Get(':id/avatar')
  @UseGuards(JwtAuthGuard)
  async getAvatarById(@Param('id') id: string, @Res() res: Response) {
  const user = await this.userService.findById(Number(id)) as any;
  if (!user || !user.avatar) return res.status(404).send('Sem avatar');
  const buf: Buffer = user.avatar as Buffer;
  res.setHeader('Content-Type', user.avatarMimeType || 'image/png');
  res.setHeader('Content-Length', buf.length.toString());
  res.setHeader('Cache-Control', 'no-store');
  return res.end(buf);
  }

  @Put('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\//)) return cb(new Error('Arquivo deve ser uma imagem'), false);
      cb(null, true);
    },
    limits: { fileSize: 2 * 1024 * 1024 }
  }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) {
      return { message: 'Nenhum arquivo enviado' };
    }
  // log simples de tamanho
  console.log('[UPLOAD AVATAR]', req.user.id, 'size', file.size, 'mimetype', file.mimetype);
    const updated = await this.userService.updateUser(req.user.id, { avatar: file.buffer, avatarMimeType: file.mimetype });
    return { message: 'Avatar atualizado', user: { ...updated, avatar: undefined } };
  }

  @Put(':id/department')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateDepartment(@Param('id') id: string, @Body() body: any, @Req() req) {
    try {
      const departmentId = body?.departmentId ?? null;
      const updated = await this.userService.updateDepartment(Number(id), departmentId, req.user.id);
      return { message: 'Departamento atualizado', user: updated };
    } catch (error) {
      return { message: 'Erro ao atualizar departamento', error: error.response || error.message };
    }
  }

  @Put(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUserRole(@Param('id') id: string, @Body() body: UpdateUserRoleDto, @Req() req) {
    try {
      const updated = await this.userService.updateRole(Number(id), body, req.user.id);
      return { message: 'Role atualizada', user: updated };
    } catch (error) {
      return { message: 'Erro ao atualizar role', error: error.response || error.message };
    }
  }
}
