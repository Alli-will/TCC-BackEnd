import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, } from "typeorm";
import { DiaryEntry } from "../../DiaryEntry/entity/Diary.entity";
import { Post } from '../../post/entity/post.entity'; 

@Entity()
export class User{
 @PrimaryGeneratedColumn()
 id: number;

 @Column()
 firstName: string;

 @Column()
 lastName: string;

 @Column({unique: true})
 email: string;

 @Column()
 password: string;

 @OneToMany(() => DiaryEntry, diaryEntry => diaryEntry.user)
  diaryEntries: DiaryEntry[];

  @OneToMany(() => Post, post => post.user)
  posts: Post[];  

}