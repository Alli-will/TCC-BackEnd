import { Controller, Post, Body, Get, Param, Delete, Patch, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupportMaterialService } from './support-material.service';
import { CreateSupportMaterialDto } from './dto/create-support-material.dto';
import { UpdateSupportMaterialDto } from './dto/update-support-material.dto';

@Controller('support-material')
export class SupportMaterialController {
  constructor(private readonly service: SupportMaterialService) {}

  @Post()
  @UseInterceptors(FileInterceptor('attachment'))
  async create(
    @Body() body: CreateSupportMaterialDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!body.url && !file) {
      throw new BadRequestException('attachment ou url deve ser informado.');
    }
    const data = { ...body, attachment: file ? file.buffer : undefined };
    return this.service.create(data);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('attachment'))
  async update(
    @Param('id') id: string,
    @Body() body: UpdateSupportMaterialDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!body.url && !file) {
      throw new BadRequestException('attachment ou url deve ser informado.');
    }
    const data = { ...body, attachment: file ? file.buffer : undefined };
    return this.service.update(Number(id), data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
