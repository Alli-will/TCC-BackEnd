import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Post } from '../../post/entity/post.entity';
import { User } from '../../user/entity/user.entity';

@Entity()
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
    created_at: Date;

  @ManyToOne(() => Post, post => post.likes)
  post: Post;

  @ManyToOne(() => User, user => user.likes)
  user: User;
}
