import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DiaryEntry } from "../../DiaryEntry/entity/Diary.entity";
import { Post } from '../../post/entity/post.entity'; 
import { Consult } from '../../consul/entity/consult.entity'; 
import { Like } from '../../post/entity/like.entity';
import { Comment } from '../../post/entity/comment.entity';

export enum UserRole {
  CLIENT = 'client',
  PSYCHOLOGIST = 'psychologist',
  PSYCHIATRIST = 'psychiatrist',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  first_Name: string;

  @Column()
  last_Name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @CreateDateColumn()
    created_at: Date;

  @OneToMany(() => DiaryEntry, diaryEntry => diaryEntry.user)
  diaryEntries: DiaryEntry[];

  @OneToMany(() => Post, post => post.user)
  posts: Post[];

  @OneToMany(() => Consult, consult => consult.client)
  consultationsAsClient: Consult[];

  @OneToMany(() => Consult, consult => consult.professional)
  consultationsAsProfessional: Consult[];

  @OneToMany(() => Like, like => like.user)
  likes: Like[];

  @OneToMany(() => Comment, comment => comment.user)
  comments: Comment[];
}
