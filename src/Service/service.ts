import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../Entity/entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  create(post: Post): Promise<Post> {
    return this.postsRepository.save(post);
  }

  findAll(): Promise<Post[]> {
    return this.postsRepository.find();
  }

  findOne(id: number): Promise<Post> {
    return this.postsRepository.findOne({ where: { id } });
  }

  async update(id: number, post: Partial<Post>): Promise<Post> {
    await this.postsRepository.update(id, post);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.postsRepository.delete(id);
  }
}