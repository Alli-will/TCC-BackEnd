import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any): Promise<{ id: number; email: string; role: string; companyId: number }> {
    const user = await this.userService.findById(payload.sub) as any;
    if (!user) {
      throw new UnauthorizedException('Token inválido');
    }
    if (user.ativo === false) {
      throw new UnauthorizedException('Usuário inativo. Valide com um administrador.');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company?.id,
    };
  }
}
