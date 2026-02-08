import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateDto, UpdateDto, ResponseDto } from '../DTO';
import { Post, PostDocument } from '../schemas/post.schema';
import { mapToDto } from '../../../utils/Mapper/mapper';
import { Paginated } from '../../../utils/types/pagination';
import { InternalApiClient } from '../../../utils/Api/api';
import { Category } from '../../category/schemas/category.schema';

/**
 * MongoDB를 사용하는 게시글 관련 비즈니스 로직을 처리하는 서비스 클래스
 * 
 * 게시글의 생성, 조회, 수정, 삭제 등의 비즈니스 로직을 MongoDB를 통해 처리합니다.
 */
@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    private readonly apiClient: InternalApiClient,
  ) {}

  /**
   * Post 데이터에 카테고리 정보를 추가하는 헬퍼 함수
   */
  private async enrichPostWithCategoryInfo(post: any): Promise<ResponseDto> {
    const authorNickname = await this.apiClient.getUserNickname(post.authorEmail);
    const responseDto = mapToDto(post, ResponseDto);
    responseDto.author = authorNickname ?? 'Unknown';
    
    // mainCategory 정보 추가
    responseDto.mainCategory = post.mainCategoryId?.value || '';
    responseDto.mainCategoryLabel = post.mainCategoryId?.label || '';
    
    // subCategory 정보 추가 (populate된 경우)
    if (post.subCategoryId) {
      responseDto.subCategory = post.subCategoryId?.value || '';
      responseDto.subCategoryLabel = post.subCategoryId?.label || '';
    }
    
    return responseDto;
  }

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
    
    // populate로 카테고리 정보 가져오기
    const populated = await this.postModel
      .findById(created._id)
      .populate('mainCategoryId', 'value label')
      .populate('subCategoryId', 'value label')
      .lean()
      .exec();
    
    if (!populated) {
      throw new BadRequestException('Failed to create post');
    }
    
    return this.enrichPostWithCategoryInfo(populated);
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
  async findAll(mainCategoryValue?: string, subCategoryValue?: string, page: number = 1, limit: number = 10): Promise<Paginated<ResponseDto>> {
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than 0');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than 0');
    }

    const query: any = {};
    
    // mainCategoryValue가 주어지면 해당 value를 가진 Category(메인)의 ObjectId를 찾아서 필터링
    if (mainCategoryValue && mainCategoryValue.trim() !== '') {
      const category = await this.categoryModel.findOne({ 
        value: mainCategoryValue.trim(), 
        parentId: null 
      });
      if (category) {
        query.mainCategoryId = category._id;
      } else {
        return { data: [], meta: { totalItems: 0, currentPage: page, totalPages: 0, itemsPerPage: limit } };
      }
    }
    
    // subCategoryValue가 주어지면 해당 value를 가진 Category(서브)의 _id를 찾아서 필터링
    if (subCategoryValue && subCategoryValue.trim() !== '') {
      if (query.mainCategoryId) {
        // mainCategory가 지정된 경우
        const subCat = await this.categoryModel.findOne({ 
          value: subCategoryValue.trim(), 
          parentId: query.mainCategoryId 
        });
        if (subCat) {
          query.subCategoryId = subCat._id;
        } else {
          return { data: [], meta: { totalItems: 0, currentPage: page, totalPages: 0, itemsPerPage: limit } };
        }
      } else {
        // mainCategory가 지정되지 않은 경우
        const subCategories = await this.categoryModel.find({ 
          value: subCategoryValue.trim(), 
          parentId: { $ne: null } 
        });
        if (subCategories.length > 0) {
          query.subCategoryId = { $in: subCategories.map(cat => cat._id) };
        } else {
          return { data: [], meta: { totalItems: 0, currentPage: page, totalPages: 0, itemsPerPage: limit } };
        }
      }
    }
    
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.postModel.find(query)
        .select('-content')
        .populate('mainCategoryId', 'value label')
        .populate('subCategoryId', 'value label')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.postModel.countDocuments(query)
    ]);

    // 각 게시글의 authorEmail을 author(닉네임)로 변환
    const postsWithAuthor = await Promise.all(
      posts.map(async (post: any) => {
        const authorNickname = await this.apiClient.getUserNickname(post.authorEmail);
        const responseDto = mapToDto(post, ResponseDto);
        responseDto.author = authorNickname ?? 'Unknown';
        responseDto.mainCategory = post.mainCategoryId?.value || '';
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

    const post = await this.postModel
      .findById(id)
      .populate('mainCategoryId', 'value label')
      .populate('subCategoryId', 'value label')
      .lean()
      .exec();
      
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // 조회수 증가 로직
    if (!viewed) {
      await this.incrementViewCount(id);
    }

    const authorNickname = await this.apiClient.getUserNickname(post.authorEmail);
    const responseDto = mapToDto(post, ResponseDto);
    responseDto.author = authorNickname ?? 'Unknown';
    responseDto.mainCategory = (post.mainCategoryId as any)?.value || '';
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

    const post = await this.postModel
      .findById(id)
      .populate('mainCategoryId', 'value label')
      .populate('subCategoryId', 'value label')
      .lean()
      .exec();
      
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // 작성자 권한 확인
    if (post.authorEmail !== userEmail) {
      throw new ForbiddenException('Only the author can edit this post');
    }

    const authorNickname = await this.apiClient.getUserNickname(post.authorEmail);
    const responseDto = mapToDto(post, ResponseDto);
    responseDto.author = authorNickname ?? 'Unknown';
    responseDto.mainCategory = (post.mainCategoryId as any)?.value || '';
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
      .populate('mainCategoryId', 'value label')
      .populate('subCategoryId', 'value label')
      .lean()
      .exec();
    
    if (!updated) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    const authorNickname = await this.apiClient.getUserNickname(updated.authorEmail);
    const responseDto = mapToDto(updated, ResponseDto);
    responseDto.author = authorNickname ?? 'Unknown';
    responseDto.mainCategory = (updated.mainCategoryId as any)?.value || '';
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
    const posts = await this.postModel
      .find({ authorEmail })
      .populate('mainCategoryId', 'value label')
      .populate('subCategoryId', 'value label')
      .lean()
      .exec();
    
    // 각 게시글에 카테고리 정보와 author 추가
    const postsWithAuthor = await Promise.all(
      posts.map(async (post: any) => this.enrichPostWithCategoryInfo(post))
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
    })
    .populate('mainCategoryId', 'value label')
    .populate('subCategoryId', 'value label')
    .lean()
    .exec();

    // 각 게시글에 카테고리 정보와 author 추가
    const postsWithAuthor = await Promise.all(
      posts.map(async (post: any) => this.enrichPostWithCategoryInfo(post))
    );

    return postsWithAuthor;
  }

  /**
   * 메인 카테고리와 서브 카테고리로 게시글을 검색합니다.
   * 
   * @param {string} mainCategoryValue - 검색할 메인 카테고리 value (옵션)
   * @param {string} subCategoryValue - 검색할 서브 카테고리 value (옵션)
   * @returns {Promise<Paginated<ResponseDto>>} - 검색 결과 게시글 목록
   */
  async findByThemeAndCategory(mainCategoryValue?: string, subCategoryValue?: string, page: number = 1, limit: number = 10): Promise<Paginated<ResponseDto>> {
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than 0');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than 0');
    }

    const query: any = {};
    
    // mainCategoryValue가 주어지면 해당 value를 가진 Category의 ObjectId를 찾아서 필터링
    if (mainCategoryValue) {
      const category = await this.categoryModel.findOne({ value: mainCategoryValue, parentId: null });
      if (category) {
        query.mainCategoryId = category._id;
      } else {
        // 카테고리를 찾을 수 없으면 빈 결과 반환
        return { data: [], meta: { totalItems: 0, currentPage: page, totalPages: 0, itemsPerPage: limit } };
      }
    }
    
    // subCategoryValue가 주어지면 해당 value를 가진 Category(서브)의 _id를 찾아서 필터링
    if (subCategoryValue) {
      if (query.mainCategoryId) {
        // mainCategory가 지정된 경우, 해당 부모를 가진 subCategory 찾기
        const subCat = await this.categoryModel.findOne({ 
          value: subCategoryValue, 
          parentId: query.mainCategoryId 
        });
        if (subCat) {
          query.subCategoryId = subCat._id;
        } else {
          // subCategory를 찾을 수 없으면 빈 결과 반환
          return { data: [], meta: { totalItems: 0, currentPage: page, totalPages: 0, itemsPerPage: limit } };
        }
      } else {
        // mainCategory가 지정되지 않은 경우, 모든 서브 카테고리에서 value로 찾기
        const subCategories = await this.categoryModel.find({ 
          value: subCategoryValue, 
          parentId: { $ne: null } 
        });
        
        if (subCategories.length > 0) {
          query.subCategoryId = { $in: subCategories.map(cat => cat._id) };
        } else {
          // subCategory를 찾을 수 없으면 빈 결과 반환
          return { data: [], meta: { totalItems: 0, currentPage: page, totalPages: 0, itemsPerPage: limit } };
        }
      }
    }
    
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.postModel.find(query)
        .select('-content')
        .populate('mainCategoryId', 'value label')
        .populate('subCategoryId', 'value label')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.postModel.countDocuments(query)
    ]);

    // 각 게시글에 카테고리 정보와 author 추가
    const postsWithAuthor = await Promise.all(
      posts.map(async (post: any) => this.enrichPostWithCategoryInfo(post))
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

