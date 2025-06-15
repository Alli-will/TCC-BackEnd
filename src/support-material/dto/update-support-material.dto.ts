import { PartialType } from '@nestjs/mapped-types';
import { CreateSupportMaterialDto } from './create-support-material.dto';

export class UpdateSupportMaterialDto extends PartialType(CreateSupportMaterialDto) {}
