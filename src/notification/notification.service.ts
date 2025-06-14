import { Injectable } from '@nestjs/common';
<<<<<<< HEAD
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entity/notification.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(message: string, userId: number): Promise<Notification> {
    const notification = this.notificationRepository.create({
      message,
      user: { id: userId },
    });
    return await this.notificationRepository.save(notification);
  }

  async findAllForAdmin(): Promise<Notification[]> {
    return await this.notificationRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
=======
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
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
    });
  }
}
