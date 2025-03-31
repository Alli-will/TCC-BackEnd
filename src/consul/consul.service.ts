import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consul } from '../consul/entity/consul.entity';
import { CreateConsulDto } from '../consul/dto/CreateConsulDto';

@Injectable()
export class ConsulService {
  constructor(
    @InjectRepository(Consul)
    private readonly consulRepository: Repository<Consul>,
  ) {}

  async create(createConsulDto: CreateConsulDto, userId: number): Promise<Consul> {
    const consul = this.consulRepository.create({
      ...createConsulDto,
      user: { id: userId },
    });
    return await this.consulRepository.save(consul);
  }

  async findByUserId(userId: number): Promise<Consul[]> {
    return await this.consulRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async findByType(userId: number, type: 'psychologist' | 'psychiatrist'): Promise<Consul[]> {
    return await this.consulRepository.find({
      where: { user: { id: userId }, type },
      relations: ['user'],
    });
  }

  async update(id: number, updateData: Partial<CreateConsulDto>, userId: any): Promise<Consul> {
    await this.consulRepository.update(id, updateData);
    return this.consulRepository.findOne({ where: { id } });
  }

  async delete(id: number, userId: any): Promise<void> {
    const consul = await this.consulRepository.findOne({ where: { id } });

    if (!consul) {
      throw new NotFoundException('Consulta não encontrada.');
    }

    const now = new Date();
    const consultationDate = new Date(consul.date);
    const differenceInHours = (consultationDate.getTime() - now.getTime()) / (1000 * 60 * 60); 

    if (differenceInHours < 24) {
      throw new BadRequestException('A consulta só pode ser cancelada com pelo menos 24  horas de antecedência.');
    }

    await this.consulRepository.remove(consul);
  }
}