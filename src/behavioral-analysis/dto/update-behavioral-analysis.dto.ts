import { PartialType } from '@nestjs/mapped-types';
import { CreateBehavioralAnalysisDto } from './create-behavioral-analysis.dto';

export class UpdateBehavioralAnalysisDto extends PartialType(CreateBehavioralAnalysisDto) {}
