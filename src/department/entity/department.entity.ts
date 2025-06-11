import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Company } from '../../company/entity/company.entity';

@Entity()
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => User, (user) => user.department)
  users: User[];

  @ManyToOne(() => Company, (company) => company.departments)
   company: Company;
}
