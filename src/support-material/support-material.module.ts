import { Module } from '@nestjs/common';
import { SupportMaterialController } from './support-material.controller';
import { SupportMaterialService } from './support-material.service';
import { PrismaModule } from '../../prisma/prisma.module';


@Module({
  imports: [PrismaModule],
  controllers: [SupportMaterialController],
  providers: [SupportMaterialService],
  exports: [SupportMaterialService],
})
export class SupportMaterialModule {}
