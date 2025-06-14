<<<<<<< HEAD
import {Injectable,CanActivate,ExecutionContext,} from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { UserRole } from '../user/entity/user.entity';
  import { ROLES_KEY } from '../auth/roles.decorator';
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
      
        if (!user) {
          console.warn('RolesGuard: request.user está undefined');
          return false;
        }
      
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
          context.getHandler(),
          context.getClass(),
        ]);
      
        if (!requiredRoles) {
          return true; // Nenhum papel requerido -> acesso liberado
        }
      
        return requiredRoles.includes(user.role);
      }
  }
  
=======
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, ROLES_KEY } from '../auth/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      console.warn('RolesGuard: request.user está undefined');
      return false;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Nenhum papel requerido -> acesso liberado
    }

    return requiredRoles.includes(user.role);
  }
}
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
