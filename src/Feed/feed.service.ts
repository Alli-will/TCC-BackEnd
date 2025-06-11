import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

    if (!feed || !user) {
      throw new NotFoundException('Postagem ou usuário não encontrado');
    }

    const comment = this.commentRepository.create({content: text, user, feed });
    return this.commentRepository.save(comment);
  }

  async likeFeed(feedId: number, userId: number): Promise<Like | string> {
    const feed = await this.feedRepository.findOne({ where: { id: feedId } });
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!feed || !user) {
      throw new NotFoundException('Postagem ou usuário não encontrado');
    }

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
    });

    if (!feed) {
      throw new NotFoundException('Publicação não encontrada');
    }

    if (feed.user.id !== userId) {
      throw new ForbiddenException('Você não tem permissão para excluir esta Publicação');
    }

    await this.feedRepository.remove(feed);
  }
}
