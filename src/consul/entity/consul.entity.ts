import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity()
export class Consul {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column()
  type: 'psychologist' | 'psychiatrist';

  @ManyToOne(() => User, (user) => user.consul)
  user: User;
}