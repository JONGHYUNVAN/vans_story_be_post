import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository } from '../Repository/repository';
import { CreateDto, UpdateDto, ResponseDto } from '../Dto/dto';
import { mapToDto } from '../Mapper/mapper';
import { PaginateQuery, Paginated } from 'nestjs-paginate';

/**
 * 게시글 관련 비즈니스 로직을 처리하는 서비스 클래스
 * 
 * @class PostsService
 * @description 게시글의 생성, 조회, 수정, 삭제 등의 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class PostsService {
  constructor(private readonly postsRepository: PostsRepository) {}

  /**
   * 새로운 게시글을 생성합니다.
   * 
   * @param {CreateDto} createDto - 게시글 생성에 필요한 데이터 (제목, 내용 등)
   * @param {string} authorEmail - 게시글 작성자의 이메일
   * @returns {Promise<ResponseDto>} 생성된 게시글 정보
   * 
   * @throws {Error} 게시글 생성 중 발생한 오류
   * 
   * @example
   * ```typescript
   * const createDto = { title: '제목', content: '내용' };
   * const authorEmail = 'user@example.com';
   * const newPost = await postsService.create(createDto, authorEmail);
   * ```
   */
  async create(createDto: CreateDto, authorEmail: string): Promise<ResponseDto> {
    const post = await this.postsRepository.create(createDto, authorEmail);
    return mapToDto(post, ResponseDto);
  }

  /**
   * 페이지네이션이 적용된 게시글 목록을 조회합니다.
   * 
   * @param {PaginateQuery} query - 페이지네이션 쿼리 파라미터
   * @returns {Promise<Paginated<ResponseDto>>} 페이지네이션이 적용된 게시글 목록
   * 
   * @example
   * ```typescript
   * const query = { page: 1, limit: 10 };
   * const posts = await postsService.findAll(query);
   * ```
   */
  async findAll(query: PaginateQuery): Promise<Paginated<ResponseDto>> {
    const paginatedPosts = await this.postsRepository.findAllPaginated(query);
    return {
      ...paginatedPosts,
      data: paginatedPosts.data.map((post) => mapToDto(post, ResponseDto)),
    };
  }

  /**
   * 특정 ID의 게시글을 조회합니다.
   * 
   * @param {number} id - 조회할 게시글의 ID
   * @returns {Promise<ResponseDto>} 조회된 게시글 정보
   * 
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * ```typescript
   * const post = await postsService.findOne(1);
   * ```
   */
  async findOne(id: number): Promise<ResponseDto> {
    const post = await this.postsRepository.findOne(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return mapToDto(post, ResponseDto);
  }

  /**
   * 특정 ID의 게시글을 수정합니다.
   * 
   * @param {number} id - 수정할 게시글의 ID
   * @param {UpdateDto} updateDto - 수정할 게시글 데이터
   * @returns {Promise<ResponseDto>} 수정된 게시글 정보
   * 
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * ```typescript
   * const updateDto = { title: '수정된 제목' };
   * const updatedPost = await postsService.update(1, updateDto);
   * ```
   */
  async update(id: number, updateDto: UpdateDto): Promise<ResponseDto> {
    await this.postsRepository.update(id, updateDto);
    const updated = await this.postsRepository.findOne(id);
    if (!updated) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return mapToDto(updated, ResponseDto);
  }

  /**
   * 특정 ID의 게시글을 삭제합니다.
   * 
   * @param {number} id - 삭제할 게시글의 ID
   * @returns {Promise<void>}
   * 
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * ```typescript
   * await postsService.remove(1);
   * ```
   */
  async remove(id: number): Promise<void> {
    const post = await this.postsRepository.findOne(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    await this.postsRepository.remove(id);
  }

  /**
   * 특정 작성자의 게시글 목록을 조회합니다.
   * 
   * @param {string} authorId - 작성자 ID
   * @returns {Promise<ResponseDto[]>} 작성자의 게시글 목록
   * 
   * @example
   * ```typescript
   * const authorPosts = await postsService.findByAuthor('author@example.com');
   * ```
   */
  async findByAuthor(authorId: string): Promise<ResponseDto[]> {
    const posts = await this.postsRepository.findByAuthor(authorId);
    return posts.map((post) => mapToDto(post, ResponseDto));
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
    const posts = await this.postsRepository.searchPosts(keyword);
    return posts.map((post) => mapToDto(post, ResponseDto));
  }
}
