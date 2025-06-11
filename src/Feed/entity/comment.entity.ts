import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Feed } from './feed.entity';
import { User } from '../../user/entity/user.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @CreateDateColumn()
    created_at: Date;

  @ManyToOne(() => Feed, feed => feed.comments)
  feed: Feed;

  @ManyToOne(() => User, user => user.comments)
  user: User;
}
