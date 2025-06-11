import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Department } from "./entity/department.entity";
import { Company } from "../company/entity/company.entity";
import { User } from "../user/entity/user.entity"; 
import { CreateDepartmentDto } from "./dto/department.dto";

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,

    @InjectRepository(Company)
    private companyRepository: Repository<Company>,

    @InjectRepository(User) // Repositório para acessar os dados do usuário administrador
    private userRepository: Repository<User>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto, creatorUserId: number): Promise<Department> {
    // Verifica se o usuário administrador existe
    const creatorUser = await this.userRepository.findOne({
      where: { id: creatorUserId },
      relations: ['company'],
    });

    if (!creatorUser || !creatorUser.company) {
      throw new BadRequestException('Usuário não está vinculado a uma empresa.');
    }

    // Pega o companyId diretamente do usuário administrador
    const company = creatorUser.company;

    // Criação do departamento com a empresa associada
    const department = this.departmentRepository.create({
      name: createDepartmentDto.name,
      company,
    });

    return this.departmentRepository.save(department);
  }

  findAll(): Promise<Department[]> {
    return this.departmentRepository.find({
      relations: ['company'],
    });
  }
}
