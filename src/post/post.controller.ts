import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/post.dto';
import { CommentPostDto } from './Dto/comment.dto';
import { LikePostDto } from './Dto/like.dto';
import { Post as PostEntity } from './entity/post.entity';
import { Comment } from './entity/comment.entity';
import { Like } from './entity/like.entity';

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

  @Post(':id/comment')
  commentPost(
    @Param('id') postId: number,
    @Body() body: CommentPostDto,
  ): Promise<Comment> {
    return this.postService.commentPost(postId, body.userId, body.text);
  }
  
  @Post(':id/like')
  likePost(
    @Param('id') postId: number,
    @Body() body: LikePostDto,
  ): Promise<Like | string> {
    console.log('like request received', {postId , body});
    return this.postService.likePost(postId, body.userId);
  }

  
}