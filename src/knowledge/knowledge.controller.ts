import { Controller, Post, Body, Get, Param, Delete, Req, UseGuards, Patch, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('anexo'))
  async create(
    @Body() dto: CreateKnowledgeDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    const userId = req.user.id;
    if (!file && !dto.url) {
      return { statusCode: 400, message: 'anexo ou url deve ser informado.' };
    }
    if (file) {
      dto.anexo = file.buffer;
    }
    return this.knowledgeService.create(dto, userId);
  }

  @Get()
  findAll(@Query('includeDeleted') includeDeleted?: string) {
    return this.knowledgeService.findAll(includeDeleted === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: number, @Query('includeDeleted') includeDeleted?: string) {
    return this.knowledgeService.findOne(id, includeDeleted === 'true');
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateKnowledgeDto) {
    return this.knowledgeService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.knowledgeService.remove(id);
  }
}
