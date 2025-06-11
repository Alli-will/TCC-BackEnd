import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Department } from '../../department/entity/department.entity';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  cnpj: string;

  @Column()
  address: string;

  @Column()
  addressZipCode: number;

  @Column()
  neighborhood: string;

  @Column()
  municipality: string;

  @Column()
  state: string;

  @Column()
  country: string;

  @Column()
  phone: number;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Department, (department) => department.company)
  departments: Department[];
}
