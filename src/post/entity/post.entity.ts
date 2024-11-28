import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entity/user.entity'; // Certifique-se de que o caminho da importação está correto

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
  likedBy: string[]; // IDs dos usuários que curtiram o post

  @Column('text', { array: true, default: [] })
  comments: string[];

  // Relacionamento ManyToOne com User (um usuário pode ter muitos posts)
  @ManyToOne(() => User, user => user.posts)
  user: User;  // Relacionamento com a entidade User
}