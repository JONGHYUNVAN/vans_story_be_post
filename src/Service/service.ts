import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateDto, UpdateDto, ResponseDto } from '../DTO/dto';
import { Post, PostDocument } from '../schemas/post.schema';
import { mapToDto } from '../Mapper/mapper';
import { PaginateQuery, Paginated } from 'nestjs-paginate';
import { InternalApiClient } from '../utils/Api/api';
/**
 * MongoDB를 사용하는 게시글 관련 비즈니스 로직을 처리하는 서비스 클래스
 * 
 * @class PostsService
 * @description 게시글의 생성, 조회, 수정, 삭제 등의 비즈니스 로직을 MongoDB를 통해 처리합니다.
 */
@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private readonly apiClient: InternalApiClient,
  ) {}

  /**
   * 새로운 게시글을 생성합니다.
   * 
   * @param {CreateDto} createDto - 게시글 생성에 필요한 데이터 (제목, 내용 등)
   * @param {string} authorEmail - 게시글 작성자의 이메일
   * @returns {Promise<ResponseDto>} 생성된 게시글 정보 (MongoDB Document)
   * 
   * @throws {Error} MongoDB 작업 중 발생한 오류
   * 
   * @example
   * ```typescript
   * const createDto = { title: '제목', content: '내용', theme: 'dark' };
   * const authorEmail = 'user@example.com';
   * const newPost = await postsService.create(createDto, authorEmail);
   * ```
   */
  async create(createDto: CreateDto, authorEmail: string): Promise<ResponseDto> {
    console.log('createDto:', createDto);
    console.log('authorEmail:', authorEmail);
    const created = await this.postModel.create({
      ...createDto,
      authorEmail
    });
    console.log('created post:', created);
    return mapToDto(created.toObject(), ResponseDto);
  }

  /**
   * 페이지네이션이 적용된 게시글 목록을 조회합니다.
   * 
   * @param {PaginateQuery} query - 페이지네이션 쿼리 파라미터
   * @returns {Promise<Paginated<ResponseDto>>} 페이지네이션이 적용된 게시글 목록
   * @property {ResponseDto[]} data - 게시글 목록
   * @property {Object} meta - 페이지네이션 메타 정보
   * @property {Object} links - 이전/다음 페이지 링크
   * 
   * @example
   * ```typescript
   * const query = { 
   *   page: 1, 
   *   limit: 10,
   *   sortBy: [['createdAt', 'DESC']],
   *   search: '검색어'
   * };
   * const posts = await postsService.findAll(query);
   * ```
   */
  async findAll(query: PaginateQuery): Promise<Paginated<ResponseDto>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [data, totalItems] = await Promise.all([
      this.postModel.find().skip(skip).limit(limit).exec(),
      this.postModel.countDocuments()
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: data.map(post => mapToDto(post.toObject(), ResponseDto)),
      meta: {
        itemsPerPage: limit,
        totalItems,
        currentPage: page,
        totalPages,
        sortBy: [['createdAt', 'DESC']],
        searchBy: ['title', 'content', 'theme', 'authorEmail'],
        search: '',
        filter: {},
        select: ['title', 'content', 'theme', 'authorEmail', 'createdAt', 'updatedAt']
      },
      links: {
        current: `posts?page=${page}&limit=${limit}`,
        next: page < totalPages ? `posts?page=${page + 1}&limit=${limit}` : '',
        previous: page > 1 ? `posts?page=${page - 1}&limit=${limit}` : ''
      }
    };
  }
  /**
   * 특정 ID의 게시글을 조회합니다.
   * 
   * @param {string} id - 조회할 게시글의 ID
   * @returns {Promise<ResponseDto>} 조회된 게시글 정보
   * 
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * ```typescript
   * const post = await postsService.findOne('1');
   * ```
   */
  async findOne(id: string): Promise<ResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid post ID: ${id}`);
    }

    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    const authorNickname = await this.apiClient.getUserNickname(post.authorEmail);
    const responseDto = mapToDto(post.toObject(), ResponseDto);
    responseDto.author = authorNickname;
    return responseDto;
  }

  /**
   * 특정 ID의 게시글을 수정합니다.
   * 
   * @param {string} id - 수정할 게시글의 ID
   * @param {UpdateDto} updateDto - 수정할 게시글 데이터
   * @returns {Promise<ResponseDto>} 수정된 게시글 정보
   * 
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * ```typescript
   * const updateDto = { title: '수정된 제목' };
   * const updatedPost = await postsService.update('1', updateDto);
   * ```
   */
  async update(id: string, updateDto: UpdateDto): Promise<ResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid post ID: ${id}`);
    }

    const updated = await this.postModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    
    if (!updated) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return mapToDto(updated.toObject(), ResponseDto);
  }

  /**
   * 특정 ID의 게시글을 삭제합니다.
   * 
   * @param {string} id - 삭제할 게시글의 ID
   * @returns {Promise<void>}
   * 
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * ```typescript
   * await postsService.remove('1');
   * ```
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid post ID: ${id}`);
    }

    const result = await this.postModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
  }

  /**
   * 특정 작성자의 게시글 목록을 조회합니다.
   * 
   * @param {string} authorEmail - 작성자의 이메일
   * @returns {Promise<ResponseDto[]>} 작성자의 게시글 목록
   * 
   * @example
   * ```typescript
   * const authorPosts = await postsService.findByAuthor('author@example.com');
   * ```
   */
  async findByAuthor(authorEmail: string): Promise<ResponseDto[]> {
    const posts = await this.postModel.find({ authorEmail }).exec();
    return posts.map(post => mapToDto(post.toObject(), ResponseDto));
  }

  /**
   * 키워드로 게시글을 검색합니다.
   * 
   * @param {string} keyword - 검색 키워드
   * @returns {Promise<ResponseDto[]>} 검색된 게시글 목록
   * 
   * @example
   * ```typescript
   * const searchResults = await postsService.searchPosts('검색어');
   * ```
   */
  async searchPosts(keyword: string): Promise<ResponseDto[]> {
    const posts = await this.postModel
      .find({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { content: { $regex: keyword, $options: 'i' } }
        ]
      })
      .exec();
    return posts.map(post => mapToDto(post.toObject(), ResponseDto));
  }

  /**
   * 테마와 카테고리로 게시글을 검색합니다.
   * 
   * @param {string} theme - 검색할 테마 (옵션)
   * @param {string} category - 검색할 카테고리 (옵션)
   * @returns {Promise<ResponseDto[]>} - 검색 결과 게시글 목록
   */
  async findByThemeAndCategory(theme?: string, category?: string): Promise<ResponseDto[]> {
    const query: any = {};
    
    if (theme) {
      query.theme = theme;
    }
    
    if (category) {
      query.category = category;
    }
    
    const posts = await this.postModel.find(query).exec();
    return posts.map(post => mapToDto(post.toObject(), ResponseDto));
  }
}
