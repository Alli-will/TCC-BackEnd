import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entity/user.entity'; 

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column('int', { default: 0 })
  likes: number;

  @Column('text', { array: true, default: [] })
  likedBy: string[]; 

  @Column('text', { array: true, default: [] })
  comments: string[];


  @ManyToOne(() => User, user => user.posts)
  user: User;  
}