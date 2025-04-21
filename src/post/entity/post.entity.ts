import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Like } from './like.entity';
import { Comment } from './comment.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @CreateDateColumn()
    created_at: Date;

  @ManyToOne(() => User, user => user.posts)
  user: User;

  @OneToMany(() => Like, like => like.post, { cascade: true })
  likes: Like[];

  @OneToMany(() => Comment, comment => comment.post, { cascade: true })
  comments: Comment[];
}


