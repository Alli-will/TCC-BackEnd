import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendPasswordReset(to: string, token: string) {
    const appUrl = this.config.get<string>('APP_URL') || 'https://front-tccc.vercel.app';
    const resetLink = `${appUrl}/nova-senha/${token}`;
    const subject = 'Recuperação de senha';
    const html = `
      <div style="background:#f4fafc;padding:12px 0 24px 0;min-height:40vh;font-family:sans-serif;">
        <div style="max-width:420px;margin:32px auto 0 auto;background:#fff;border-radius:14px;box-shadow:0 4px 24px rgba(56,182,165,0.10);padding:28px 22px 22px 22px;">
          <h2 style="color:#38b6a5;font-size:1.35rem;margin-bottom:18px;font-weight:700;">Redefinição de senha</h2>
          <p style="color:#444;font-size:1rem;margin-bottom:18px;">Olá,<br>Recebemos uma solicitação para redefinir sua senha. Para criar uma nova senha, clique no botão abaixo:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${resetLink}" style="display:inline-block;padding:13px 32px;background:#38b6a5;color:#fff;font-weight:600;font-size:1.08rem;border-radius:8px;text-decoration:none;border:1px solid #2d998b;box-shadow:0 2px 8px rgba(56,182,165,0.13);">Definir nova senha</a>
          </div>
          <p style="color:#666;font-size:.98rem;margin-bottom:0;">Se você não solicitou essa alteração, ignore este e-mail.<br>O link é válido por 30 minutos.</p>
          <div style="margin-top:24px;text-align:center;color:#b2b2b2;font-size:.85rem;">Equipe Calma Mente</div>
        </div>
      </div>
    `;
    const apiKey = this.config.get<string>('BREVO_API_KEY');
    const from = { email: (this.config.get<string>('SMTP_FROM') || 'no-reply@example.com').replace(/.*<(.*)>.*/,'$1'), name: 'Calma Mente' };
    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: from,
          to: [{ email: to }],
          subject,
          htmlContent: html,
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      this.logger.log(`Password reset email sent to ${to}`);
      return true;
    } catch (e) {
      this.logger.error('Failed to send reset email', e?.response?.data || e);
    }
    this.logger.log(`Password reset token for ${to}: ${token}`);
    return false;
  }
}
