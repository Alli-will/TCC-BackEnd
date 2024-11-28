import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service'; 
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, 'masterkey', { expiresIn: '1h' }
    );
    return { token, user: { id: user.id, email: user.email } };
  }
}