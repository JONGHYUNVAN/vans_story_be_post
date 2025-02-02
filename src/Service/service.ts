import { Injectable } from '@nestjs/common';
import { Post } from '../Entity/entity';
import { PostsRepository } from '../Repository/repository';

@Injectable()
export class PostsService {
  constructor(private readonly postsRepository: PostsRepository) {}

  async create(post: Post): Promise<Post> {
    return this.postsRepository.create(post);
  }

  async findAll(): Promise<Post[]> {
    return this.postsRepository.findAll();
  }

  async findOne(id: number): Promise<Post> {
    return this.postsRepository.findOne(id);
  }

  async update(id: number, post: Partial<Post>): Promise<Post> {
    await this.postsRepository.update(id, post);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.postsRepository.remove(id);
  }
}