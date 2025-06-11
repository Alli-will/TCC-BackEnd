import {registerDecorator,ValidationOptions,ValidatorConstraint,ValidatorConstraintInterface,ValidationArguments} from 'class-validator';
  import { Injectable } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { User } from '../user/entity/user.entity';
  
  @ValidatorConstraint({ name: 'IsUniqueEmail', async: true })
  @Injectable()
  export class IsUniqueEmailConstraint implements ValidatorConstraintInterface {
    constructor(
      @InjectRepository(User)
      private userRepository: Repository<User>,
    ) {}
  
    async validate(email: string, args: ValidationArguments) {
      if (!this.userRepository) {
        throw new Error('Repository not injected!');
      }
      
      const user = await this.userRepository.findOne({ 
        where: { email },
        select: ['id'] 
      });
      
      return !user;
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