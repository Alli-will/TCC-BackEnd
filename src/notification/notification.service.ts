import { Injectable } from '@nestjs/common';
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
    });
  }
}
