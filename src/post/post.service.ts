import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entity/post.entity';
import { CreatePostDto } from './dto/post.dto'; 

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async findAll(): Promise<Post[]> {
    return this.postRepository.find();
  }

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const post = this.postRepository.create(createPostDto);
    return this.postRepository.save(post);
  }

  async commentPost(postId: number, comment: string): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    post.comments.push(comment);
    return this.postRepository.save(post);
  }

  async likePost(postId: number, userId: string): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    const userIndex = post.likedBy.indexOf(userId);

    if (userIndex === -1) {
      post.likes++;
      post.likedBy.push(userId);
    } else {
      post.likes--;
      post.likedBy.splice(userIndex, 1);
    }

    return this.postRepository.save(post);
  }

  async delete(postId: number, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id: postId }, relations: ['user'] });
  
    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }
  
    // Verifica se o usuário que está tentando excluir é o dono do post
    // Converta post.user.id para string ou userId para number para garantir a comparação correta
    if (post.user.id.toString() !== userId) {
      throw new ForbiddenException('Você não tem permissão para excluir este post');
    }
  
    await this.postRepository.remove(post);
  }
}