import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsIn(['admin', 'employee', 'support'])
  role: 'admin' | 'employee' | 'support';
}
