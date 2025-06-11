import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { FeedService } from './feed.service';
import { CreateFeedDto } from './Dto/feed.dto';
import { CommentFeedDto } from './Dto/comment.dto';
import { LikeFeedDto } from './Dto/like.dto';
import { Feed as FeedEntity } from './entity/feed.entity';
import { Comment } from './entity/comment.entity';
import { Like } from './entity/like.entity';

@Controller('Feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  findAll(): Promise<FeedEntity[]> {
    return this.feedService.findAll();
  }

  @Post()
  create(@Body() feeddata: CreateFeedDto): Promise<FeedEntity> {
    return this.feedService.create(feeddata);
  }

  @Post(':id/comment')
  commentFeed(
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

  
}