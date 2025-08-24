import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service'; 
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService,
              private readonly jwtService: JwtService, 
  ) {}

  async login(email: string, password: string) {
  const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Usuário não cadastrado');
    }
    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Senha incorreta');
    }

    const u: any = user;
    const payload = {
      sub: u.id,
      email: u.email,
      role: u.role,
      companyId: u.company?.id,
      first_Name: u.first_Name,
      last_Name: u.last_Name
    };
    
    const token = this.jwtService.sign(payload, { expiresIn: '1h' });
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }
}