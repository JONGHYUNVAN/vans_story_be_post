import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../Entity/entity';
import { CreateDto, UpdateDto } from '../Dto/dto';
import { paginate, PaginateQuery, Paginated } from 'nestjs-paginate';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post)
    private readonly repository: Repository<Post>,
  ) {}

  async create(createDto: CreateDto, authorEmail: string): Promise<Post> {
    const post = this.repository.create({ ...createDto, authorEmail });
    return this.repository.save(post);
  }

  async findAll(): Promise<Post[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findAllPaginated(query: PaginateQuery): Promise<Paginated<Post>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'createdAt'], 
      searchableColumns: ['title', 'content'],
      defaultSortBy: [['createdAt', 'DESC']], 
    });
  }

  async findOne(id: number): Promise<Post> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: number, updateDto: UpdateDto): Promise<void> {
    await this.repository.update(id, updateDto);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findByAuthor(authorId: string): Promise<Post[]> {
    return this.repository.createQueryBuilder('post')
      .where('post.authorId = :authorId', { authorId })
      .orderBy('post.createdAt', 'DESC')
      .getMany();
  }

  async searchPosts(keyword: string): Promise<Post[]> {
    return this.repository.createQueryBuilder('post')
      .where(
        'post.title LIKE :keyword OR post.content LIKE :keyword',
        { keyword: `%${keyword}%` },
      )
      .orderBy('post.createdAt', 'DESC')
      .getMany();
  }
}
