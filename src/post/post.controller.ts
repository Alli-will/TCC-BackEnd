import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './Dto/post.dto';
import { Post as PostEntity } from './entity/post.entity';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  findAll(): Promise<PostEntity[]> {
    return this.postService.findAll();
  }

  @Post()
  create(@Body() postData: CreatePostDto): Promise<PostEntity> {
    return this.postService.create(postData);
  }


  @Post(':id/like')
  likePost(@Param('id') postId: number, @Body('userId') userId: string): Promise<PostEntity> {
    return this.postService.likePost(postId, userId);
  }


  @Post(':id/comment')
  commentPost(@Param('id') postId: number, @Body('comment') comment: string): Promise<PostEntity> {
    return this.postService.commentPost(postId, comment);
  }


  @Delete(':id')
  delete(@Param('id') postId: number, @Body('userId') userId: string): Promise<void> {
    return this.postService.delete(postId, userId);
  }
}