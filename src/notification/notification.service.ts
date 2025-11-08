import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(message: string, userId: number) {
    return await this.prisma.notification.create({
      data: {
        message,
        user: { connect: { id: userId } },
      },
    });
  }

  async notifyAllUsers(message: string, companyId?: number) {
    const users = await this.prisma.user.findMany({
      where: companyId ? { companyId } : { companyId: { not: null } },
    });
    const notifications = users.map((user) =>
      this.prisma.notification.create({
        data: { message, user: { connect: { id: user.id } } },
      }),
    );
    return Promise.all(notifications);
  }

  async findAllForAdmin(companyId?: number, allowAllSupport = false) {
    const where: any = {};
    if (companyId && !allowAllSupport) {
      where.user = { companyId };
    }
    return await this.prisma.notification.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
