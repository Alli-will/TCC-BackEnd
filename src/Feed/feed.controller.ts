<<<<<<< HEAD
import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
=======
import { Controller, Get, Post, Body, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
import { FeedService } from './feed.service';
import { CreateFeedDto } from './Dto/feed.dto';
import { CommentFeedDto } from './Dto/comment.dto';
import { LikeFeedDto } from './Dto/like.dto';
<<<<<<< HEAD
import { Feed as FeedEntity } from './entity/feed.entity';
import { Comment } from './entity/comment.entity';
import { Like } from './entity/like.entity';
=======
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)

@Controller('Feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
<<<<<<< HEAD
  findAll(): Promise<FeedEntity[]> {
=======
  findAll(): Promise<any[]> {
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
    return this.feedService.findAll();
  }

  @Post()
<<<<<<< HEAD
  create(@Body() feeddata: CreateFeedDto): Promise<FeedEntity> {
    return this.feedService.create(feeddata);
=======
  @UseGuards(JwtAuthGuard)
  create(@Body() feeddata: CreateFeedDto, @Req() req: any): Promise<any> {
    const userId = req.user.id;
    return this.feedService.create(feeddata, userId);
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
  }

  @Post(':id/comment')
  commentFeed(
<<<<<<< HEAD
    @Param('id') feedId: number,
    @Body() body: CommentFeedDto,
  ): Promise<Comment> {
    return this.feedService.commentFeed(feedId, body.userId, body.text);
  }
  
  @Post(':id/like')
  likeFeed(
    @Param('id') feedId: number,
    @Body() body: LikeFeedDto,
  ): Promise<Like | string> {
    console.log('like request received', {feedId , body});
    return this.feedService.likeFeed(feedId, body.userId);
  }

  
=======
    @Param('id', ParseIntPipe) feedId: number,
    @Body() body: CommentFeedDto,
  ): Promise<any> {
    return this.feedService.commentFeed(feedId, body.userId, body.text);
  }

  @Post(':id/like')
  likeFeed(
    @Param('id', ParseIntPipe) feedId: number,
    @Body() body: LikeFeedDto,
  ): Promise<any | string> {
    return this.feedService.likeFeed(feedId, body.userId);
  }
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
}