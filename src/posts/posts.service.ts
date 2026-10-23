import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreatePostDto, UpdatePostDto, PostResponseDto } from './dto';
import { Post, PostDocument } from './schemas/post.schema';
import { mapToDto } from 'src/common/serialization/map-to-dto';
import { Paginated } from 'src/common/interfaces/paginated.interface';
import { UserServiceClient } from 'src/user-service/user-service.client';
import { Category } from 'src/categories/schemas/category.schema';
import { SearchServiceClient, SearchIndexPayload } from 'src/search-service/search-service.client';
import { Role } from 'src/auth/role.enum';
import { DEFAULT_POSTS_PER_PAGE } from './posts.constants';

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
    private readonly userServiceClient: UserServiceClient,
    private readonly searchServiceClient: SearchServiceClient,
  ) {}

  /**
   * populate된 게시글을 응답 DTO로 바꿉니다. 작성자 닉네임을 사용자 서비스에서 조회하고
   * 메인·서브 카테고리 value·label을 채웁니다.
   */
  private async toResponseDto(post: any): Promise<PostResponseDto> {
    const authorNickname = await this.userServiceClient.getNicknameByEmail(post.authorEmail);
    const postResponse = mapToDto(post, PostResponseDto);
    postResponse.author = authorNickname ?? 'Unknown';
    
    // mainCategory 정보 추가
    postResponse.mainCategory = post.mainCategoryId?.value || '';
    postResponse.mainCategoryLabel = post.mainCategoryId?.label || '';
    
    // subCategory 정보 추가 (populate된 경우)
    if (post.subCategoryId) {
      postResponse.subCategory = post.subCategoryId?.value || '';
      postResponse.subCategoryLabel = post.subCategoryId?.label || '';
    }
    
    return postResponse;
  }

  /**
   * 새로운 게시글을 생성합니다.
   * 
   * @param {CreatePostDto} createPostDto - 게시글 생성에 필요한 데이터 (제목, 내용 등)
   * @param {string} authorEmail - 게시글 작성자의 이메일
   * @returns {Promise<PostResponseDto>} 생성된 게시글 정보 (MongoDB Document)
   *
   * @throws {BadRequestException} 작성자 이메일이 없거나, 카테고리 조합이 존재하지 않는 경우
   * @throws {Error} MongoDB 작업 중 발생한 오류
   * 
   * @example
   * ```typescript
   * const post = await postsService.create(createPostDto, 'user@example.com');
   * ```
   */
  async create(createPostDto: CreatePostDto, authorEmail: string): Promise<PostResponseDto> {
    if (!authorEmail || !authorEmail.includes('@')) {
      throw new BadRequestException('Invalid author email');
    }

    if (!createPostDto.title || !createPostDto.content) {
      throw new BadRequestException('Title and content are required');
    }

    await this.assertCategoryPair(createPostDto.mainCategoryId, createPostDto.subCategoryId);

    const createdPost = await this.postModel.create({
      ...createPostDto,
      authorEmail
    });
    
    // populate로 카테고리 정보 가져오기
    const populatedPost = await this.postModel
      .findById(createdPost._id)
      .populate('mainCategoryId', 'value label')
      .populate('subCategoryId', 'value label')
      .lean()
      .exec();
    
    if (!populatedPost) {
      throw new BadRequestException('Failed to create post');
    }

    const postResponse = await this.toResponseDto(populatedPost);

    // fire-and-forget: 검색 인덱스 등록 (응답을 차단하지 않음)
    const searchIndexPayload: SearchIndexPayload = {
      post_id: String((populatedPost as any)._id),
      title: populatedPost.title,
      description: populatedPost.description,
      content: populatedPost.content,
      topic: populatedPost.topic,
      tags: populatedPost.tags ?? [],
      mainCategory: (populatedPost.mainCategoryId as any)?.value || '',
      subCategory: (populatedPost.subCategoryId as any)?.value || '',
      language: populatedPost.language,
      author: postResponse.author,
      createdAt: (populatedPost as any).createdAt instanceof Date
        ? (populatedPost as any).createdAt.toISOString()
        : String((populatedPost as any).createdAt ?? ''),
      updatedAt: (populatedPost as any).updatedAt instanceof Date
        ? (populatedPost as any).updatedAt.toISOString()
        : String((populatedPost as any).updatedAt ?? ''),
    };
    this.searchServiceClient.indexPost(searchIndexPayload).catch((error) => console.error('[SearchIndex] Failed to index post:', error));

    return postResponse;
  }

  /**
   * 메인·서브 카테고리 조합이 실제로 있는지 확인합니다.
   *
   * 메인은 `parentId`가 없는 카테고리, 서브는 그 메인을 부모로 둔 카테고리여야 합니다.
   * DTO의 `@IsMongoId()`는 형식만 보므로, 없는 카테고리를 가리키는 게시글이 저장되지 않게 여기서 막습니다.
   *
   * @throws {BadRequestException} 카테고리가 없거나 부모 관계가 맞지 않는 경우
   */
  private async assertCategoryPair(mainCategoryId: string, subCategoryId: string): Promise<void> {
    const [mainCategory, subCategory] = await Promise.all([
      this.categoryModel.findById(mainCategoryId).lean().exec(),
      this.categoryModel.findById(subCategoryId).lean().exec(),
    ]);
    if (!mainCategory || mainCategory.parentId) {
      throw new BadRequestException('mainCategoryId가 존재하는 메인 카테고리가 아닙니다.');
    }
    if (!subCategory || String(subCategory.parentId) !== String(mainCategory._id)) {
      throw new BadRequestException('subCategoryId가 해당 메인 카테고리의 서브 카테고리가 아닙니다.');
    }
  }

  /**
   * 페이지네이션이 적용된 게시글 목록을 조회합니다.
   * 
   * @param {string} [mainCategoryValue] - 필터링할 메인 카테고리 value
   * @param {string} [subCategoryValue] - 필터링할 서브 카테고리 value
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=DEFAULT_POSTS_PER_PAGE] - 페이지당 게시글 수
   * @returns {Promise<Paginated<PostResponseDto>>} 페이지네이션이 적용된 게시글 목록
   */
  async findAll(mainCategoryValue?: string, subCategoryValue?: string, page: number = 1, limit: number = DEFAULT_POSTS_PER_PAGE): Promise<Paginated<PostResponseDto>> {
    if (page < 1) {
      throw new BadRequestException('Page number must be greater than 0');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than 0');
    }

    const filter: FilterQuery<Post> = {};
    
    // mainCategoryValue가 주어지면 해당 value를 가진 Category(메인)의 ObjectId를 찾아서 필터링
    if (mainCategoryValue && mainCategoryValue.trim() !== '') {
      const mainCategory = await this.categoryModel.findOne({ 
        value: mainCategoryValue.trim(), 
        parentId: null 
      });
      if (mainCategory) {
        filter.mainCategoryId = mainCategory._id;
      } else {
        return { data: [], meta: { totalItems: 0, currentPage: page, totalPages: 0, itemsPerPage: limit } };
      }
    }
    
    // subCategoryValue가 주어지면 해당 value를 가진 Category(서브)의 _id를 찾아서 필터링
    if (subCategoryValue && subCategoryValue.trim() !== '') {
      if (filter.mainCategoryId) {
        // mainCategory가 지정된 경우
        const subCategory = await this.categoryModel.findOne({ 
          value: subCategoryValue.trim(), 
          parentId: filter.mainCategoryId 
        });
        if (subCategory) {
          filter.subCategoryId = subCategory._id;
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
          filter.subCategoryId = { $in: subCategories.map((subCategory) => subCategory._id) };
        } else {
          return { data: [], meta: { totalItems: 0, currentPage: page, totalPages: 0, itemsPerPage: limit } };
        }
      }
    }
    
    const skip = (page - 1) * limit;
    const [posts, totalItems] = await Promise.all([
      this.postModel.find(filter)
        .select('-content')
        .populate('mainCategoryId', 'value label')
        .populate('subCategoryId', 'value label')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.postModel.countDocuments(filter)
    ]);

    // 각 게시글의 authorEmail을 author(닉네임)로 변환
    const postResponses = await Promise.all(
      posts.map(async (post: any) => {
        const authorNickname = await this.userServiceClient.getNicknameByEmail(post.authorEmail);
        const postResponse = mapToDto(post, PostResponseDto);
        postResponse.author = authorNickname ?? 'Unknown';
        postResponse.mainCategory = post.mainCategoryId?.value || '';
        return postResponse;
      })
    );

    return {
      data: postResponses,
      meta: {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        itemsPerPage: limit
      }
    };
  }

  /**
   * 특정 ID의 게시글을 조회합니다.
   * 
   * @param {string} id - 조회할 게시글의 ID
   * @param {boolean} [hasViewed=false] - 요청자가 이미 본 게시글인지. `false`면 조회수를 1 올린다
   * @returns {Promise<PostResponseDto>} 조회된 게시글 정보
   * 
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * ```typescript
   * const post = await postsService.findOne('1');
   * ```
   */
  async findOne(id: string, hasViewed: boolean = false): Promise<PostResponseDto> {
    const post = await this.postModel
      .findById(id)
      .populate('mainCategoryId', 'value label')
      .populate('subCategoryId', 'value label')
      .lean()
      .exec();
      
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // 이미 본 게시글(x-viewed: true)이면 조회수를 올리지 않는다
    if (!hasViewed) {
      await this.incrementViewCount(id);
    }

    const authorNickname = await this.userServiceClient.getNicknameByEmail(post.authorEmail);
    const postResponse = mapToDto(post, PostResponseDto);
    postResponse.author = authorNickname ?? 'Unknown';
    postResponse.mainCategory = (post.mainCategoryId as any)?.value || '';
    return postResponse;
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
    const updatedPost = await this.postModel.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).exec();

    if (!updatedPost) {
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
   * @returns {Promise<PostResponseDto>} 수정 권한이 확인된 게시글 정보
   * 
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * @throws {ForbiddenException} 작성자가 아닌 사용자가 접근할 경우
   * 
   * @example
   * ```typescript
   * const post = await postsService.findForEdit('64f7b1c2d3e4f5a6b7c8d9e0', 'user@example.com');
   * ```
   */
  async findForEdit(id: string, userEmail: string): Promise<PostResponseDto> {
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

    const authorNickname = await this.userServiceClient.getNicknameByEmail(post.authorEmail);
    const postResponse = mapToDto(post, PostResponseDto);
    postResponse.author = authorNickname ?? 'Unknown';
    postResponse.mainCategory = (post.mainCategoryId as any)?.value || '';
    return postResponse;
  }

  /**
   * 특정 ID의 게시글을 수정합니다.
   * 
   * 관리자이거나 게시글 작성자만 수정할 수 있습니다.
   * 
   * @param {string} id - 수정할 게시글의 ID
   * @param {UpdatePostDto} updatePostDto - 수정할 게시글 데이터
   * @param {string} userEmail - 요청자의 이메일 (JWT 토큰에서 추출)
   * @param {Role[]} userRoles - 요청자의 역할 (JWT 토큰에서 정규화)
   * @returns {Promise<PostResponseDto>} 수정된 게시글 정보
   *
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * @throws {ForbiddenException} 요청자 정보나 역할이 없거나, 관리자도 작성자도 아닌 경우
   * @throws {BadRequestException} 바꾼 카테고리 조합이 존재하지 않는 경우
   */
  async update(id: string, updatePostDto: UpdatePostDto, userEmail: string, userRoles: Role[]): Promise<PostResponseDto> {
    // 권한 정보가 없으면 게시글을 보기 전에 거부한다(fail-closed)
    if (!userEmail || !userRoles?.length) {
      throw new ForbiddenException('Only the author or admin can edit this post');
    }

    const existingPost = await this.postModel.findById(id).exec();
    if (!existingPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // 권한 확인: 관리자이거나 작성자 본인
    if (!userRoles.includes(Role.Admin) && existingPost.authorEmail !== userEmail) {
      throw new ForbiddenException('Only the author or admin can edit this post');
    }

    // 카테고리를 바꾸면 바뀐 뒤의 조합이 맞는지 확인
    if (updatePostDto.mainCategoryId || updatePostDto.subCategoryId) {
      await this.assertCategoryPair(
        updatePostDto.mainCategoryId ?? String(existingPost.mainCategoryId),
        updatePostDto.subCategoryId ?? String(existingPost.subCategoryId),
      );
    }

    const updatedPost = await this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true, runValidators: true })
      .populate('mainCategoryId', 'value label')
      .populate('subCategoryId', 'value label')
      .lean()
      .exec();
    
    if (!updatedPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    const authorNickname = await this.userServiceClient.getNicknameByEmail(updatedPost.authorEmail);
    const postResponse = mapToDto(updatedPost, PostResponseDto);
    postResponse.author = authorNickname ?? 'Unknown';
    postResponse.mainCategory = (updatedPost.mainCategoryId as any)?.value || '';

    // fire-and-forget: 검색 인덱스 갱신 (응답을 차단하지 않음)
    const searchIndexPayload: SearchIndexPayload = {
      post_id: String((updatedPost as any)._id),
      title: updatedPost.title,
      description: updatedPost.description,
      content: updatedPost.content,
      topic: updatedPost.topic,
      tags: updatedPost.tags ?? [],
      mainCategory: (updatedPost.mainCategoryId as any)?.value || '',
      subCategory: (updatedPost.subCategoryId as any)?.value || '',
      language: updatedPost.language,
      author: authorNickname ?? 'Unknown',
      createdAt: (updatedPost as any).createdAt instanceof Date
        ? (updatedPost as any).createdAt.toISOString()
        : String((updatedPost as any).createdAt ?? ''),
      updatedAt: (updatedPost as any).updatedAt instanceof Date
        ? (updatedPost as any).updatedAt.toISOString()
        : String((updatedPost as any).updatedAt ?? ''),
    };
    this.searchServiceClient.indexPost(searchIndexPayload).catch((error) => console.error('[SearchIndex] Failed to index post on update:', error));

    return postResponse;
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
    const deletedPost = await this.postModel.findByIdAndDelete(id).exec();
    if (!deletedPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // fire-and-forget: 검색 인덱스 삭제 (응답을 차단하지 않음)
    this.searchServiceClient.removePostFromIndex(id).catch((error) => console.error('[SearchIndex] Failed to delete post index:', error));
  }

  /**
   * 특정 작성자의 게시글 목록을 조회합니다.
   * 
   * @param {string} authorEmail - 작성자의 이메일
   * @returns {Promise<PostResponseDto[]>} 작성자의 게시글 목록
   * 
   * @example
   * ```typescript
   * const authorPosts = await postsService.findByAuthor('author@example.com');
   * ```
   */
  async findByAuthor(authorEmail: string): Promise<PostResponseDto[]> {
    const posts = await this.postModel
      .find({ authorEmail })
      .populate('mainCategoryId', 'value label')
      .populate('subCategoryId', 'value label')
      .lean()
      .exec();
    
    // 각 게시글에 카테고리 정보와 author 추가
    const postsWithAuthor = await Promise.all(
      posts.map(async (post: any) => this.toResponseDto(post))
    );
    
    return postsWithAuthor;
  }

  /**
   * 키워드로 게시글을 검색합니다.
   * 
   * @param {string} keyword - 검색 키워드
   * @returns {Promise<PostResponseDto[]>} 검색된 게시글 목록
   * 
   * @example
   * ```typescript
   * const searchResults = await postsService.searchPosts('검색어');
   * ```
   */
  async searchPosts(keyword: string): Promise<PostResponseDto[]> {
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
      posts.map(async (post: any) => this.toResponseDto(post))
    );

    return postsWithAuthor;
  }

  /**
   * 메인 카테고리와 서브 카테고리로 게시글을 검색합니다.
   * 
   * @param {string} mainCategoryValue - 검색할 메인 카테고리 value (옵션)
   * @param {string} subCategoryValue - 검색할 서브 카테고리 value (옵션)
   * @returns {Promise<Paginated<PostResponseDto>>} - 검색 결과 게시글 목록
   */
  async findByThemeAndCategory(mainCategoryValue?: string, subCategoryValue?: string, page: number = 1, limit: number = 10): Promise<Paginated<PostResponseDto>> {
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
      posts.map(async (post: any) => this.toResponseDto(post))
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

