import { Module } from '@nestjs/common';
<<<<<<< HEAD
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
=======
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [FeedController],
  providers: [FeedService, PrismaService],
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
})
export class FeedModule {}