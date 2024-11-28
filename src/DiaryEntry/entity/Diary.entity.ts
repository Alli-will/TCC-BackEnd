import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity()
export class DiaryEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: Date;

  @Column()
  emotion: string;

  @Column('text')
  description: string;

  @ManyToOne(() => User, (user) => user.diaryEntries)
  user: User;
}