import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entity/post.entity';
import { PostService } from './post.service';
import { PostController } from './post.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Post])], // Registra a entidade para o repositório
  providers: [PostService], // Registra o serviço
  controllers: [PostController], // Registra o controlador
  exports: [PostService], // Exporta o serviço, se necessário
})
export class PostModule {}