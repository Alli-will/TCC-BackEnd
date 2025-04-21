import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entity/post.entity';
import { CreatePostDto } from './dto/post.dto';
import { User } from 'src/user/entity/user.entity';
import { Comment } from './entity/comment.entity';
import { Like } from './entity/like.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
  ) {}

  async findAll(): Promise<Post[]> {
    return this.postRepository.find({
      relations: ['user', 'comments', 'likes'],
    });
  }

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const post = this.postRepository.create(createPostDto);
    return this.postRepository.save(post);
  }

  async commentPost(postId: number, userId: number, text: string): Promise<Comment> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!post || !user) {
      throw new NotFoundException('Post ou usuário não encontrado');
    }

    const comment = this.commentRepository.create({content: text, user, post });
    return this.commentRepository.save(comment);
  }

  async likePost(postId: number, userId: number): Promise<Like | string> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!post || !user) {
      throw new NotFoundException('Post ou usuário não encontrado');
    }

    // Verifica se o usuário já curtiu
    const existingLike = await this.likeRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });

    if (existingLike) {
      await this.likeRepository.remove(existingLike);
      return 'Post descurtido';
    } else {
      const like = this.likeRepository.create({ user, post });
      return this.likeRepository.save(like);
    }
  }

  async delete(postId: number, userId: number): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    if (post.user.id !== userId) {
      throw new ForbiddenException('Você não tem permissão para excluir este post');
    }

    await this.postRepository.remove(post);
  }
}
