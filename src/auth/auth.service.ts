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
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {sub: user.id,email: user.email,role: user.role,companyId: user.company?.id
    };
    
    const token = this.jwtService.sign(payload, { expiresIn: '1h' });
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }
}