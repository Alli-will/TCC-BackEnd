import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
<<<<<<< HEAD
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feed } from './entity/feed.entity';
import { CreateFeedDto } from './Dto/feed.dto';
import { User } from '../user/entity/user.entity';
import { Comment } from './entity/comment.entity';
import { Like } from './entity/like.entity';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
  ) {}

  async findAll(): Promise<Feed[]> {
    return this.feedRepository.find({
      relations: ['user', 'comments', 'likes'],
    });
  }

  async create(createFeedDto: CreateFeedDto): Promise<Feed> {
    const feed= this.feedRepository.create(createFeedDto);
    return this.feedRepository.save(feed);
  }

  async commentFeed(feedId: number, userId: number, text: string): Promise<Comment> {
    const feed = await this.feedRepository.findOne({ where: { id: feedId } });
    const user = await this.userRepository.findOne({ where: { id: userId } });
=======
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeedDto } from './Dto/feed.dto';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.feed.findMany({
      include: { user: true, comments: true, likes: true },
    });
  }

  async create(createFeedDto: CreateFeedDto, userId: number) {
    return this.prisma.feed.create({
      data: {
        ...createFeedDto,
        user: { connect: { id: userId } },
      },
    });
  }

  async commentFeed(feedId: number, userId: number, text: string) {
    const feed = await this.prisma.feed.findUnique({ where: { id: feedId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)

    if (!feed || !user) {
      throw new NotFoundException('Postagem ou usuário não encontrado');
    }

<<<<<<< HEAD
    const comment = this.commentRepository.create({content: text, user, feed });
    return this.commentRepository.save(comment);
  }

  async likeFeed(feedId: number, userId: number): Promise<Like | string> {
    const feed = await this.feedRepository.findOne({ where: { id: feedId } });
    const user = await this.userRepository.findOne({ where: { id: userId } });
=======
    return this.prisma.comment.create({
      data: {
        content: text,
        user: { connect: { id: userId } },
        feed: { connect: { id: feedId } },
      },
    });
  }

  async likeFeed(feedId: number, userId: number) {
    const feed = await this.prisma.feed.findUnique({ where: { id: feedId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)

    if (!feed || !user) {
      throw new NotFoundException('Postagem ou usuário não encontrado');
    }

<<<<<<< HEAD
    // Verifica se o usuário já curtiu
    const existingLike = await this.likeRepository.findOne({
      where: { feed: { id: feedId }, user: { id: userId } },
    });

    if (existingLike) {
      await this.likeRepository.remove(existingLike);
      return 'Publicação descurtido';
    } else {
      const like = this.likeRepository.create({ user, feed });
      return this.likeRepository.save(like);
    }
  }

  async delete(feedId: number, userId: number): Promise<void> {
    const feed = await this.feedRepository.findOne({
      where: { id: feedId },
      relations: ['user'],
=======
    const existingLike = await this.prisma.like.findFirst({
      where: { feedId, userId },
    });

    if (existingLike) {
      await this.prisma.like.delete({ where: { id: existingLike.id } });
      return 'Publicação descurtido';
    } else {
      return this.prisma.like.create({
        data: {
          user: { connect: { id: userId } },
          feed: { connect: { id: feedId } },
        },
      });
    }
  }

  async delete(feedId: number, userId: number) {
    const feed = await this.prisma.feed.findUnique({
      where: { id: feedId },
      include: { user: true },
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
    });

    if (!feed) {
      throw new NotFoundException('Publicação não encontrada');
    }

<<<<<<< HEAD
    if (feed.user.id !== userId) {
      throw new ForbiddenException('Você não tem permissão para excluir esta Publicação');
    }

    await this.feedRepository.remove(feed);
=======
    if (feed.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para excluir esta Publicação');
    }

    await this.prisma.feed.delete({ where: { id: feedId } });
>>>>>>> b64d5f8 (migraçao do demonio do typeORM para unicornio colorido do prisma)
  }
}
