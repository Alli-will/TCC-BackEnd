import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { DiaryEntry } from "../../DiaryEntry/entity/Diary-entry.entity";
import { Feed } from '../../Feed/entity/feed.entity';
import { Like } from '../../Feed/entity/like.entity';
import { Comment } from '../../Feed/entity/comment.entity';
import { Company } from '../../company/entity/company.entity'; 
import { Notification } from '../../notification/entity/notification.entity';
import { Department } from "../../department/entity/department.entity";



export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
}

@Entity()
@Unique((['company', 'internal_id']))
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  internal_id: number;

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
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @CreateDateColumn()
  created_at: Date;


  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(() => DiaryEntry, diaryEntry => diaryEntry.user)
  diaryEntries: DiaryEntry[];

  @OneToMany(() => Feed, feed => feed.user)
  feeds: Feed[];

  @OneToMany(() => Like, like => like.user)
  likes: Like[];

  @OneToMany(() => Comment, comment => comment.user)
  comments: Comment[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @ManyToOne(() => Department, (department) => department.users, { nullable: true })
  department: Department;
}
