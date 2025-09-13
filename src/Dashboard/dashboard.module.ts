import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  // Added PrismaModule to allow direct access to PulseResponse for NPS metrics
  imports: [UserModule, PrismaModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
