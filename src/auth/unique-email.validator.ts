import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@ValidatorConstraint({ name: 'IsUniqueEmail', async: true })
@Injectable()
export class IsUniqueEmailConstraint implements ValidatorConstraintInterface {
  constructor(private prisma: PrismaService) {}

  async validate(email: string, args: ValidationArguments) {
    if (!email) return true;
    const normalized = email.trim().toLowerCase();
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: normalized },
        select: { id: true },
      });
      return !user;
    } catch (e) {
      return true;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'Email $value já está em uso. Por favor, escolha outro.';
  }
}

export function IsUniqueEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueEmailConstraint,
    });
  };
}
