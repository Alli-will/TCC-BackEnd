import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'masterkey',
    });
  }

  async validate(payload: any): Promise<{ id: number; email: string; role: string; companyId: number}> {
   // console.log('payload:', payload);
    const user = await this.userService.findById(payload.sub);
    //console.log('user:', user);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
//console.log(user);

    return { id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company?.id };
  }
}
