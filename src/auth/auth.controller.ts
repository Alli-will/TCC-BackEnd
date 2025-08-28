import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body('email') email: string, @Body('password') password: string) {
    return await this.authService.login(email, password);
  }

  @Post('request-reset')
  async requestReset(@Body('email') email: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    return await this.authService.requestPasswordReset(email, ip);
  }

  @Post('reset-password')
  async resetPass(@Body('token') token: string, @Body('password') password: string) {
    return await this.authService.resetPassword(token, password);
  }
}