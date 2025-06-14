import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

    if (!feed || !user) {
      throw new NotFoundException('Postagem ou usuário não encontrado');
    }

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

    if (!feed || !user) {
      throw new NotFoundException('Postagem ou usuário não encontrado');
    }

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
    });

    if (!feed) {
      throw new NotFoundException('Publicação não encontrada');
    }

    if (feed.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para excluir esta Publicação');
    }

    await this.prisma.feed.delete({ where: { id: feedId } });
  }
}
