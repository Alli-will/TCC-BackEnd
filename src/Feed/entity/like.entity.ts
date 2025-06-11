import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Feed } from './feed.entity';
import { User } from '../../user/entity/user.entity';

@Entity()
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
    created_at: Date;

  @ManyToOne(() => Feed, feed => feed.likes)
  feed: Feed;

  @ManyToOne(() => User, user => user.likes)
  user: User;
}
