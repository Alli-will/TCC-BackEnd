import { IsNotEmpty } from 'class-validator';

export class CreateDepartmentDto {
    companyId(createDepartmentDto: CreateDepartmentDto, companyId: any) {
        throw new Error('Method not implemented.');
    }

    @IsNotEmpty()
    name: string;


}