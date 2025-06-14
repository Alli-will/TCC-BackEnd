import { Controller, Get, Post, Body, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { FeedService } from './feed.service';
import { CreateFeedDto } from './Dto/feed.dto';
import { CommentFeedDto } from './Dto/comment.dto';
import { LikeFeedDto } from './Dto/like.dto';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';

@Controller('Feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  findAll(): Promise<any[]> {
    return this.feedService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() feeddata: CreateFeedDto, @Req() req: any): Promise<any> {
    const userId = req.user.id;
    return this.feedService.create(feeddata, userId);
  }

  @Post(':id/comment')
  commentFeed(
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
}