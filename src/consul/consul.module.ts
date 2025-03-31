import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consul } from './entity/consul.entity';
import { ConsulService } from './consul.service';
import { ConsulController } from './consul.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Consul])],
  providers: [ConsulService],
  controllers: [ConsulController],
})
export class ConsulModule {}