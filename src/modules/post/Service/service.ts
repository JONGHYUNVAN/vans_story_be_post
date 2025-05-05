import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateDto, UpdateDto, ResponseDto } from '../DTO/dto';
import { Post, PostDocument } from '../schemas/post.schema';
import { mapToDto } from '../../../utils/Mapper/mapper';
import { Paginated } from '../../../utils/types/pagination';
import { InternalApiClient } from '../../../utils/Api/api';
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
    if (!authorEmail || !authorEmail.includes('@')) {
      throw new BadRequestException('Invalid author email');
    }

    if (!createDto.title || !createDto.content) {
      throw new BadRequestException('Title and content are required');
    }

    const created = await this.postModel.create({
      ...createDto,
      authorEmail
    });
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
  async findAll(theme?: string, category?: string, page: number = 1, limit: number = 10): Promise<Paginated<ResponseDto>> {
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than 0');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than 0');
    }

    const query: any = {};
    
    if (theme && theme.trim() !== '') {
      query.theme = theme.trim();
    }
    
    if (category && category.trim() !== '') {
      query.category = category.trim();
    }
    
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.postModel.find(query)
        .select('-content')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.postModel.countDocuments(query)
    ]);

    return {
      data: posts.map(post => mapToDto(post, ResponseDto)),
      meta: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        itemsPerPage: limit
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
  async findOne(id: string, viewed: boolean = false): Promise<ResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid post ID: ${id}`);
    }

    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // 조회수 증가 로직
    if (!viewed) {
      await this.incrementViewCount(id);
    }

    const authorNickname = await this.apiClient.getUserNickname(post.authorEmail);
    const responseDto = mapToDto(post.toObject(), ResponseDto);
    responseDto.author = authorNickname;
    return responseDto;
  }
    /**
   * 게시글의 조회수를 증가시킵니다.
   * 
   * @param {string} id - 조회수를 증가시킬 게시글의 ID
   * @returns {Promise<void>}
   * 
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * ```typescript
   * await postsService.incrementViewCount('1');
   * ```
   */
    async incrementViewCount(id: string): Promise<void> {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`Invalid post ID: ${id}`);
      }
  
      const result = await this.postModel.findByIdAndUpdate(
        id,
        { $inc: { viewCount: 1 } },
        { new: true }
      ).exec();
  
      if (!result) {
        throw new NotFoundException(`Post with ID ${id} not found`);
      }
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
  async findByThemeAndCategory(theme?: string, category?: string, page: number = 1, limit: number = 10): Promise<Paginated<ResponseDto>> {
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than 0');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than 0');
    }

    const query: any = {};
    
    if (theme) {
      query.theme = theme;
    }
    
    if (category && category.trim() !== '') {
      query.category = category;
    }
    
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.postModel.find(query)
        .select('-content')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments(query)
    ]);

    return {
      data: posts.map(post => mapToDto(post.toObject(), ResponseDto)),
      meta: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        itemsPerPage: limit
      }
    };
  }
}
