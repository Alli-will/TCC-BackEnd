import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
