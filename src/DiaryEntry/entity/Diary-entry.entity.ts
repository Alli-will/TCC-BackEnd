import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { ReasonEmotion } from './reason-emotion.entity';

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

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.diaryEntries)
  user: User;

  @ManyToMany(() => ReasonEmotion, (reason) => reason.diaryEntries, { eager: true })
  @JoinTable()
  reasons: ReasonEmotion[];
}