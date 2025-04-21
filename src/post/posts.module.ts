import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Post } from './entity/post.entity';
import { User } from 'src/user/entity/user.entity';
import { Comment } from './entity/comment.entity';
import { Like } from './entity/like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, Comment, Like])],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}