import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateDto, UpdateDto, ResponseDto } from '../DTO';
import { Post, PostDocument } from '../entities/post.entity';
import { mapToDto } from '../../../utils/Mapper/mapper';
import { Paginated } from '../../../utils/types/pagination';
import { InternalApiClient } from '../../../utils/Api/api';

/**
 * MongoDB를 사용하는 게시글 관련 비즈니스 로직을 처리하는 서비스 클래스
 * 
 * 게시글의 생성, 조회, 수정, 삭제 등의 비즈니스 로직을 MongoDB를 통해 처리합니다.
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
   * const createDto = { title: '제목', content: '내용', theme: 'nestjs' };
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
   * @param {string} [theme] - 필터링할 게시글 테마 (선택사항)
   * @param {string} [category] - 필터링할 게시글 카테고리 (선택사항)
   * @param {number} [page=1] - 페이지 번호 (기본값: 1)
   * @param {number} [limit=10] - 페이지당 게시글 수 (기본값: 10)
   * @returns {Promise<Paginated<ResponseDto>>} 페이지네이션이 적용된 게시글 목록
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
  async findAll(mainCategory?: string, subCategory?: string, page: number = 1, limit: number = 10): Promise<Paginated<ResponseDto>> {
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than 0');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than 0');
    }

    const query: any = {};
    
    if (mainCategory && mainCategory.trim() !== '') {
      query.mainCategory = mainCategory.trim();
    }
    
    if (subCategory && subCategory.trim() !== '') {
      query.subCategory = subCategory.trim();
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

    // 각 게시글의 authorEmail을 author(닉네임)로 변환
    const postsWithAuthor = await Promise.all(
      posts.map(async (post) => {
        const authorNickname = await this.apiClient.getUserNickname(post.authorEmail);
        const responseDto = mapToDto(post, ResponseDto);
        responseDto.author = authorNickname ?? 'Unknown';
        return responseDto;
      })
    );

    return {
      data: postsWithAuthor,
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
    responseDto.author = authorNickname ?? 'Unknown';
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
   * 게시글 수정을 위한 조회 메서드입니다.
   * 
   * 인증된 사용자가 자신이 작성한 게시글만 수정할 수 있도록 권한을 확인합니다.
   * 토큰의 이메일과 게시글의 작성자 이메일이 일치하는지 검증합니다.
   * 
   * @param {string} id - 조회할 게시글의 ID
   * @param {string} userEmail - 요청자의 이메일 (JWT 토큰에서 추출)
   * @returns {Promise<ResponseDto>} 수정 권한이 확인된 게시글 정보
   * 
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * @throws {ForbiddenException} 작성자가 아닌 사용자가 접근할 경우
   * 
   * @example
   * ```typescript
   * const post = await postsService.findForEdit('64f7b1c2d3e4f5a6b7c8d9e0', 'user@example.com');
   * ```
   */
  async findForEdit(id: string, userEmail: string): Promise<ResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid post ID: ${id}`);
    }

    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // 작성자 권한 확인
    if (post.authorEmail !== userEmail) {
      throw new ForbiddenException('Only the author can edit this post');
    }

    const authorNickname = await this.apiClient.getUserNickname(post.authorEmail);
    const responseDto = mapToDto(post.toObject(), ResponseDto);
    responseDto.author = authorNickname ?? 'Unknown';
    return responseDto;
  }

  /**
   * 특정 ID의 게시글을 수정합니다.
   * 
   * 관리자이거나 게시글 작성자만 수정할 수 있습니다.
   * 
   * @param {string} id - 수정할 게시글의 ID
   * @param {UpdateDto} updateDto - 수정할 게시글 데이터
   * @param {string} userEmail - 요청자의 이메일 (JWT 토큰에서 추출)
   * @param {string} userRole - 요청자의 역할 (JWT 토큰에서 추출)
   * @returns {Promise<ResponseDto>} 수정된 게시글 정보
   * 
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * @throws {ForbiddenException} 수정 권한이 없는 경우
   * 
   * @example
   * ```typescript
   * const updateDto = { title: '수정된 제목' };
   * const updatedPost = await postsService.update('1', updateDto, 'user@example.com', 'user');
   * ```
   */
  async update(id: string, updateDto: UpdateDto, userEmail?: string, userRole?: string): Promise<ResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid post ID: ${id}`);
    }

    const existingPost = await this.postModel.findById(id).exec();
    if (!existingPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // 권한 확인: 관리자이거나 작성자 본인
    if (userEmail && userRole && userRole !== 'admin' && existingPost.authorEmail !== userEmail) {
      throw new ForbiddenException('Only the author or admin can edit this post');
    }

    const updated = await this.postModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    
    if (!updated) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    const authorNickname = await this.apiClient.getUserNickname(updated.authorEmail);
    const responseDto = mapToDto(updated.toObject(), ResponseDto);
    responseDto.author = authorNickname ?? 'Unknown';
    return responseDto;
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
    
    // 각 게시글의 authorEmail을 author(닉네임)로 변환
    const postsWithAuthor = await Promise.all(
      posts.map(async (post) => {
        const authorNickname = await this.apiClient.getUserNickname(post.authorEmail);
        const responseDto = mapToDto(post.toObject(), ResponseDto);
        responseDto.author = authorNickname ?? 'Unknown';
        return responseDto;
      })
    );
    
    return postsWithAuthor;
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
    const posts = await this.postModel.find({
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } }
      ]
    }).exec();

    // 각 게시글의 authorEmail을 author(닉네임)로 변환
    const postsWithAuthor = await Promise.all(
      posts.map(async (post) => {
        const authorNickname = await this.apiClient.getUserNickname(post.authorEmail);
        const responseDto = mapToDto(post.toObject(), ResponseDto);
        responseDto.author = authorNickname ?? 'Unknown';
        return responseDto;
      })
    );

    return postsWithAuthor;
  }

  /**
   * 메인 카테고리와 서브 카테고리로 게시글을 검색합니다.
   * 
   * @param {string} mainCategory - 검색할 메인 카테고리 (기존 테마, 옵션)
   * @param {string} subCategory - 검색할 서브 카테고리 (기존 카테고리, 옵션)
   * @returns {Promise<ResponseDto[]>} - 검색 결과 게시글 목록
   */
  async findByThemeAndCategory(mainCategory?: string, subCategory?: string, page: number = 1, limit: number = 10): Promise<Paginated<ResponseDto>> {
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than 0');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than 0');
    }

    const query: any = {};
    
    if (mainCategory) {
      query.mainCategory = mainCategory;
    }
    
    if (subCategory && subCategory.trim() !== '') {
      query.subCategory = subCategory;
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

    // 각 게시글의 authorEmail을 author(닉네임)로 변환
    const postsWithAuthor = await Promise.all(
      posts.map(async (post) => {
        const authorNickname = await this.apiClient.getUserNickname(post.authorEmail);
        const responseDto = mapToDto(post.toObject(), ResponseDto);
        responseDto.author = authorNickname ?? 'Unknown';
        return responseDto;
      })
    );

    return {
      data: postsWithAuthor,
      meta: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        itemsPerPage: limit
      }
    };
  }
}

