import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
<<<<<<< HEAD
import { UserRole } from '../user/entity/user.entity';
=======
import { UserRole } from '../auth/roles.decorator';
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async getAllNotifications(@Request() req) {
    return this.notificationService.findAllForAdmin();
  }
}
