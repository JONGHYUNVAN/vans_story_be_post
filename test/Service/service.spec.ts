/**
 * PostsService 단위 테스트
 * 
 * @module test/Service/service.spec
 * @description
 * 게시글 서비스의 모든 기능에 대한 단위 테스트를 수행합니다.
 * 각 메서드별로 정상 케이스와 예외 케이스를 테스트하며,
 * MongoDB 모델과 API 클라이언트를 모킹하여 독립적인 테스트를 보장합니다.
 * 
 * @example
 * ```typescript
 * // 테스트 실행
 * npm test
 * 
 * // 특정 테스트만 실행
 * npm test -- -t "should create a new post"
 * ```
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PostsService } from '../../src/Service/service';
import { Post } from '../../src/schemas/post.schema';
import { InternalApiClient } from '../../src/utils/Api/api';
import { createMockPostModel, createMockApiClient } from '../helpers/test-utils';
import { mockCreateDto, mockUpdateDto, mockResponseDto, mockPaginatedResponse } from '../fixtures/post-test-data';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let mockPostModel: any;
  let mockApiClient: any;

  /**
   * 각 테스트 전에 실행되는 설정
   * 
   * @description
   * - MongoDB 모델과 API 클라이언트를 모킹
   * - TestingModule을 생성하고 PostsService 인스턴스를 가져옴
   */
  beforeEach(async () => {
    mockPostModel = createMockPostModel();
    mockApiClient = createMockApiClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getModelToken(Post.name),
          useValue: mockPostModel,
        },
        {
          provide: InternalApiClient,
          useValue: mockApiClient,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  /**
   * 게시글 생성 테스트
   * 
   * @description
   * 새로운 게시글을 생성하고 생성된 게시글의 정보가 올바른지 검증합니다.
   * 
   * @param {CreateDto} createDto - 게시글 생성에 필요한 데이터
   * @param {string} authorEmail - 게시글 작성자의 이메일
   * @returns {Promise<ResponseDto>} 생성된 게시글 정보
   * 
   * @example
   * ```typescript
   * const createDto = {
   *   title: '테스트 게시글',
   *   content: '테스트 내용',
   *   theme: 'light',
   *   category: 'general'
   * };
   * const authorEmail = 'test@example.com';
   * const result = await service.create(createDto, authorEmail);
   * ```
   */
  describe('create', () => {
    it('should create a new post', async () => {
      // Given
      const authorEmail = 'test@example.com';
      mockPostModel.create.mockResolvedValue({
        toObject: () => mockResponseDto
      });

      // When
      const result = await service.create(mockCreateDto, authorEmail);

      // Then
      expect(mockPostModel.create).toHaveBeenCalledWith({
        ...mockCreateDto,
        authorEmail
      });
      expect(result).toEqual(mockResponseDto);
    });

    it('should throw BadRequestException when author email is invalid', async () => {
      // Given
      const invalidEmail = 'invalid-email';

      // When & Then
      await expect(service.create(mockCreateDto, invalidEmail)).rejects.toThrow('Invalid author email');
    });
  });

  /**
   * 게시글 목록 조회 테스트
   * 
   * @description
   * 페이지네이션이 적용된 게시글 목록을 조회하고 결과가 올바른지 검증합니다.
   * 
   * @param {string} [theme] - 필터링할 테마
   * @param {string} [category] - 필터링할 카테고리
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=10] - 페이지당 게시글 수
   * @returns {Promise<Paginated<ResponseDto>>} 페이지네이션이 적용된 게시글 목록
   * 
   * @example
   * ```typescript
   * // 기본 조회
   * const result = await service.findAll();
   * 
   * // 필터링 적용
   * const result = await service.findAll('light', 'general', 1, 10);
   * ```
   */
  describe('findAll', () => {
    it('should return paginated posts', async () => {
      // Given
      const theme = 'light';
      const category = 'general';
      const page = 1;
      const limit = 10;
      const totalItems = 25;

      mockPostModel.countDocuments.mockResolvedValue(totalItems);

      // When
      const result = await service.findAll(theme, category, page, limit);

      // Then
      expect(mockPostModel.find).toHaveBeenCalled();
      expect(mockPostModel.countDocuments).toHaveBeenCalled();
      
      // 데이터 검증
      expect(result.data[0]).toEqual(mockResponseDto);
      
      // 페이지네이션 메타 정보 검증
      expect(result.meta).toEqual({
        totalItems: totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        itemsPerPage: limit
      });
    });
  });

  /**
   * 단일 게시글 조회 테스트
   * 
   * @description
   * ID로 게시글을 조회하고 결과가 올바른지 검증합니다.
   * 
   * @param {string} id - 조회할 게시글의 ID
   * @param {boolean} [viewed=false] - 조회수 증가 여부
   * @returns {Promise<ResponseDto>} 조회된 게시글 정보
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * ```typescript
   * // 기본 조회
   * const post = await service.findOne('507f1f77bcf86cd799439011');
   * 
   * // 조회수 증가 없이 조회
   * const post = await service.findOne('507f1f77bcf86cd799439011', true);
   * ```
   */
  describe('findOne', () => {
    it('should return a post by id', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';
      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          toObject: () => mockResponseDto
        })
      });

      // When
      const result = await service.findOne(id);

      // Then
      expect(result).toEqual(mockResponseDto);
    });

    it('should throw NotFoundException for invalid id', async () => {
      // Given
      const id = 'invalid-id';

      // When & Then
      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * 게시글 수정 테스트
   * 
   * @description
   * 게시글을 수정하고 수정된 정보가 올바른지 검증합니다.
   * 
   * @param {string} id - 수정할 게시글의 ID
   * @param {UpdateDto} updateDto - 수정할 게시글 데이터
   * @returns {Promise<ResponseDto>} 수정된 게시글 정보
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * ```typescript
   * const updateDto = {
   *   title: '수정된 제목',
   *   content: '수정된 내용'
   * };
   * const updatedPost = await service.update('507f1f77bcf86cd799439011', updateDto);
   * ```
   */
  describe('update', () => {
    it('should update a post', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';
      mockPostModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          toObject: () => mockResponseDto
        })
      });

      // When
      const result = await service.update(id, mockUpdateDto);

      // Then
      expect(result).toEqual(mockResponseDto);
    });

    it('should throw NotFoundException for invalid id', async () => {
      // Given
      const id = 'invalid-id';

      // When & Then
      await expect(service.update(id, mockUpdateDto)).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * 게시글 조회수 증가 테스트
   * 
   * @description
   * 게시글의 조회수를 증가시키는 기능을 테스트합니다.
   * 
   * @param {string} id - 조회수를 증가시킬 게시글의 ID
   * @returns {Promise<void>}
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * ```typescript
   * // 정상 케이스
   * await service.incrementViewCount('507f1f77bcf86cd799439011');
   * 
   * // 예외 케이스
   * await service.incrementViewCount('invalid-id');
   * ```
   */
  describe('incrementViewCount', () => {
    it('should increment view count of a post', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';
      mockPostModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: id,
          viewCount: 1
        })
      });

      // When
      await service.incrementViewCount(id);

      // Then
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { $inc: { viewCount: 1 } },
        { new: true }
      );
    });

    it('should throw NotFoundException for invalid id', async () => {
      // Given
      const id = 'invalid-id';

      // When & Then
      await expect(service.incrementViewCount(id)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when post not found', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';
      mockPostModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      // When & Then
      await expect(service.incrementViewCount(id)).rejects.toThrow(NotFoundException);
    });
  });
}); 