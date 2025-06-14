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

  async findAllForAdmin() {
    return await this.prisma.notification.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
