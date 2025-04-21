import { Injectable, NotFoundException, BadRequestException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consult } from './entity/consult.entity';
import { CreateConsultDto } from './Dto/CreateConsultDto';
import { User } from '../user/entity/user.entity';

@Injectable()
export class ConsultService {
  constructor(
    @InjectRepository(Consult)
    private readonly consultRepository: Repository<Consult>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createConsultDto: CreateConsultDto, userId: any): Promise<Consult> {
    const { clientId, professionalId, date, price, type } = createConsultDto;

    const client = await this.userRepository.findOne({
      where: { id: clientId },
    });

    const professional = await this.userRepository.findOne({
      where: { id: professionalId },
    });

    if (!client || !professional) {
      throw new NotFoundException('Cliente ou profissional não encontrado.');
    }

    const consult = this.consultRepository.create({
      date,
      type,
      price,
      client,
      professional,
    });

    return await this.consultRepository.save(consult);
  }

  async findByUserId(userId: number): Promise<Consult[]> {
    return await this.consultRepository.find({
      where: { client: { id: userId } },
      relations: ['client', 'professional'],
    });
  }

  async findByType(
    userId: number,
    type: 'psychologist' | 'psychiatrist',
  ): Promise<Consult[]> {
    return await this.consultRepository.find({
      where: { client: { id: userId }, type },
      relations: ['client', 'professional'],
    });
  }

  async update(
    id: number,
    updateData: Partial<CreateConsultDto>,
    userId: number,
  ): Promise<Consult> {
    await this.consultRepository.update(id, updateData);
    return this.consultRepository.findOne({
      where: { id },
      relations: ['client', 'professional'],
    });
  }

  async delete(id: number, userId: number): Promise<void> {
    const consult = await this.consultRepository.findOne({
      where: { id },
      relations: ['client'],
    });

    if (!consult) {
      throw new NotFoundException('Consulta não encontrada.');
    }

    const now = new Date();
    const consultationDate = new Date(consult.date);
    const differenceInHours =
      (consultationDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (differenceInHours < 24) {
      throw new BadRequestException(
        'A consulta só pode ser cancelada com pelo menos 24 horas de antecedência.',
      );
    }

    await this.consultRepository.remove(consult);
  }
}
