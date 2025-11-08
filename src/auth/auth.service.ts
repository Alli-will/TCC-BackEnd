import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private ipRequests: Map<string, { count: number; first: number }> = new Map();
  private emailCooldown: Map<string, number> = new Map();
  private EMAIL_COOLDOWN_MS = 60_000; // 1 min entre solicitações por email
  private IP_WINDOW_MS = 15 * 60_000; //janela de tempo para contar tentativas por IP
  private IP_MAX = 20; // máP x 20 requisições de reset por I
  private hashEmail(email: string) {
    return crypto
      .createHash('sha256')
      .update(email.toLowerCase())
      .digest('hex');
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Usuário não cadastrado');
    }
    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Senha incorreta');
    }
    if ((user as any).ativo === false) {
      throw new UnauthorizedException(
        'Usuário inativo. Valide com um administrador.',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: (user as any).company?.id,
      first_Name: (user as any).first_Name,
      last_Name: (user as any).last_Name,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '1h' });
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }

  async requestPasswordReset(email: string, ip?: string) {
    // Rate limit por IP
    if (ip) {
      const now = Date.now();
      const rec = this.ipRequests.get(ip);
      if (!rec || now - rec.first > this.IP_WINDOW_MS) {
        this.ipRequests.set(ip, { count: 1, first: now });
      } else {
        rec.count++;
        if (rec.count > this.IP_MAX) {
          return {
            ok: true,
            message: 'Se o e-mail existir, enviaremos instruções.',
          }; // silencioso
        }
      }
    }
    // Cooldown por e-mail (genérico, sem expor existência)
    const last = this.emailCooldown.get(email.toLowerCase());
    if (last && Date.now() - last < this.EMAIL_COOLDOWN_MS) {
      return {
        ok: true,
        message: 'Se o e-mail existir, enviaremos instruções.',
      };
    }
    this.emailCooldown.set(email.toLowerCase(), Date.now());

    // Logging interno removido para não utilizar console em produção.
    const hashed = this.hashEmail(email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const raw = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 1000 * 60 * 30);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetToken: raw, resetTokenExpires: expires } as any,
      });
      this.mail.sendPasswordReset(email, raw).catch(() => {});
    }
    return {
      ok: true,
      message:
        'Se o e-mail existir, enviaremos instruções para redefinir a senha. Caso não encontre nossa mensagem na caixa de entrada, verifique também a pasta de spam.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token) throw new BadRequestException('Token inválido');
    const user = await this.prisma.user.findFirst({
      where: { resetToken: token } as any,
    });
    const uAny = user as any;
    if (
      !user ||
      !uAny.resetTokenExpires ||
      uAny.resetTokenExpires < new Date()
    ) {
      throw new BadRequestException('Token expirado ou inválido');
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        resetToken: null,
        resetTokenExpires: null,
      } as any,
    });
    return { ok: true };
  }
}
