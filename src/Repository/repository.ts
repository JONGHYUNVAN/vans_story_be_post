import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../Entity/entity';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post)
    private readonly repository: Repository<Post>,
  ) {}

  async create(post: Post): Promise<Post> {
    return this.repository.save(post);
  }

  async findAll(): Promise<Post[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<Post> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: number, post: Partial<Post>): Promise<void> {
    await this.repository.update(id, post);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
