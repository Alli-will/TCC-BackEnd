import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { Feed } from './entity/feed.entity';
import { User } from '../user/entity/user.entity';
import { Comment } from './entity/comment.entity';
import { Like } from './entity/like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Feed, User, Comment, Like])],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}