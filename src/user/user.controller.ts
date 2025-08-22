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
import * as crypto from 'crypto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Lista usuários apenas da mesma empresa (exceto suporte que pode ver todos se query all=true)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAllUsers(@Req() req, @Query('all') all?: string, @Query('companyId') companyIdQuery?: string) {
    try {
      const requester = req.user;
      const allowAll = requester.role === 'support' && all === 'true';
      // Suporte pode pedir usuários de uma empresa específica via companyId
      const requestedCompanyId = requester.role === 'support' && companyIdQuery ? Number(companyIdQuery) : undefined;
      if (!allowAll && !requestedCompanyId && !requester.companyId) {
        return { message: 'Usuário não vinculado a empresa.' };
      }
      const scopeCompany = allowAll ? undefined : (requestedCompanyId || requester.companyId);
      const users = await this.userService.findAll(scopeCompany, allowAll);
      return users;
    } catch (error) {
      return {
        message: 'Erro ao buscar usuários.',
        error: error.response || error.message,
      };
    }
  }
  @Post('register-access')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPORT)
  @HttpCode(HttpStatus.CREATED)
  async registerAccess(@Body() createUserDto: CreateUserDto, @Req() req) {
    try {
      // Apenas suporte (já garantido pelo guard) pode criar admin inicial para uma empresa existente
      if (!createUserDto.companyId) {
        return { message: 'companyId é obrigatório.' };
      }
      const createdUser = await this.userService.createAccessUser(createUserDto);
      return {
        message: 'Usuário administrador criado com sucesso!',
        user: createdUser,
      };
    } catch (error) {
      if (error.getResponse && typeof error.getResponse === 'function') {
        const response = error.getResponse();
        if (response && response.message) {
          return {
            message: 'Erro ao criar usuário administrador.',
            details: response.message,
          };
        }
      }
      return {
        message: 'Erro ao criar usuário administrador.',
        error: error.response || error.message,
      };
    }
  }
  @Post('create-collaborator')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  async createCollaborator(@Body() createUserDto: CreateUserDto, @Req() req) {
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
  return user;
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
  const user = await this.userService.findByIdWithAvatar(req.user.id) as any;
    if (!user || !user.avatar) return res.status(404).send('Sem avatar');
    const buf: Buffer = user.avatar as Buffer;
    const mime = user.avatarMimeType || 'image/png';
    // ETag baseado no conteúdo para cache eficiente
    const etag = '"' + crypto.createHash('md5').update(buf).digest('hex') + '"';
    const ifNoneMatch = (req.headers['if-none-match'] || '') as string;
    if (ifNoneMatch && ifNoneMatch === etag) {
      return res.status(304).end();
    }
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', buf.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 dia
    res.setHeader('ETag', etag);
    return res.end(buf);
  }

  // Meta enxuta: informa apenas se há avatar e a versão (etag)
  @Get('me/avatar/meta')
  @UseGuards(JwtAuthGuard)
  async getMyAvatarMeta(@Req() req) {
  const user = await this.userService.findByIdWithAvatar(req.user.id) as any;
    if (!user || !user.avatar) return { hasAvatar: false };
    const buf: Buffer = user.avatar as Buffer;
    const etag = crypto.createHash('md5').update(buf).digest('hex');
    return { hasAvatar: true, mimeType: user.avatarMimeType || 'image/png', etag };
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
  async getAvatarById(@Param('id') id: string, @Req() req, @Res() res: Response) {
  const user = await this.userService.findByIdWithAvatar(Number(id)) as any;
    if (!user || !user.avatar) return res.status(404).send('Sem avatar');
    const buf: Buffer = user.avatar as Buffer;
    const mime = user.avatarMimeType || 'image/png';
    const etag = '"' + crypto.createHash('md5').update(buf).digest('hex') + '"';
    const ifNoneMatch = (req.headers['if-none-match'] || '') as string;
    if (ifNoneMatch && ifNoneMatch === etag) {
      return res.status(304).end();
    }
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', buf.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('ETag', etag);
    return res.end(buf);
  }

  @Get(':id/avatar/base64')
  @UseGuards(JwtAuthGuard)
  async getAvatarByIdBase64(@Param('id') id: string) {
  const user = await this.userService.findByIdWithAvatar(Number(id)) as any;
    if (!user || !user.avatar) return { hasAvatar: false };
    const buf: Buffer = user.avatar as Buffer;
    return {
      hasAvatar: true,
      mimeType: user.avatarMimeType || 'image/png',
      base64: buf.toString('base64')
    };
  }

  // Meta por ID
  @Get(':id/avatar/meta')
  @UseGuards(JwtAuthGuard)
  async getAvatarByIdMeta(@Param('id') id: string) {
  // precisa incluir os bytes do avatar para calcular meta corretamente
  const user = await this.userService.findByIdWithAvatar(Number(id)) as any;
    if (!user || !user.avatar) return { hasAvatar: false };
    const buf: Buffer = user.avatar as Buffer;
    const etag = crypto.createHash('md5').update(buf).digest('hex');
    return { hasAvatar: true, mimeType: user.avatarMimeType || 'image/png', etag };
  }

  // Endpoint de debug para investigar avatar "corrompido"
  @Get(':id/avatar/debug')
  @UseGuards(JwtAuthGuard)
  async debugAvatar(@Param('id') id: string) {
    const user = await this.userService.findByIdWithAvatar(Number(id)) as any;
    if (!user || !user.avatar) return { hasAvatar: false };
    const buf: Buffer = user.avatar as Buffer;
    const etag = crypto.createHash('md5').update(buf).digest('hex');
    const head = buf.subarray(0, 16);
    return {
      hasAvatar: true,
      size: buf.length,
      mimeType: user.avatarMimeType || 'image/png',
      etag,
      headHex: Array.from(head).map(b => b.toString(16).padStart(2, '0')).join(' ')
    };
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
    // Evita salvar strings tipo "[object Object]" por algum fluxo incorreto
    if (!(file.buffer instanceof Buffer) || file.buffer.toString('utf8',0,15).startsWith('[object Object]')) {
      return { message: 'Arquivo inválido (corrompido)' };
    }
  // log simples de tamanho
    const updated = await this.userService.updateUser(req.user.id, { avatar: file.buffer, avatarMimeType: file.mimetype });
    return { message: 'Avatar atualizado', user: { ...updated, avatar: undefined } };
  }

  // Auditoria: lista avatares da empresa (apenas admin) com primeiros bytes
  @Get('audit/avatars')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async auditAvatars(@Req() req) {
    const companyId = req.user.companyId;
    if (!companyId) return { message: 'Sem empresa' };
    const list = await this.userService.findCompanyAvatars(companyId) as any[];
    return list.map(u => {
      const buf: Buffer | null = u.avatar as Buffer | null;
      if (!buf) return { id: u.id, hasAvatar: false };
      const head = buf.subarray(0, 16);
      return {
        id: u.id,
        hasAvatar: true,
        size: buf.length,
        mimeType: u.avatarMimeType || 'unknown',
        headHex: Array.from(head).map(b => b.toString(16).padStart(2, '0')).join(' ')
      };
    });
  }

  @Post('audit/avatars/clear-corrupted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async clearCorrupted(@Req() req) {
    const companyId = req.user.companyId;
    if (!companyId) return { message: 'Sem empresa' };
    const result = await this.userService.sanitizeCorruptedAvatars(companyId);
    return { result };
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
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async updateUserRole(@Param('id') id: string, @Body() body: UpdateUserRoleDto, @Req() req) {
    try {
      const updated = await this.userService.updateRole(Number(id), body, req.user.id);
      return { message: 'Role atualizada', user: updated };
    } catch (error) {
      return { message: 'Erro ao atualizar role', error: error.response || error.message };
    }
  }
}
