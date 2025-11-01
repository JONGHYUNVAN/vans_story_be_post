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
import { PostsService } from '../../../src/modules/post/Service/service';
import { Post } from '../../../src/modules/post/entities/post.entity';
import { InternalApiClient } from '../../../src/utils/Api/api';
import { createMockPostModel, createMockApiClient } from '../../helpers/test-utils';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { MockGenerator } from '../../helpers/mock-generator';
import { CreateDto, UpdateDto, ResponseDto } from '../../../src/modules/post/dto';
import { Types } from 'mongoose';

describe('PostsService', () => {
  let service: PostsService;
  let mockPostModel: any;
  let mockApiClient: any;
  let mockResponseDto: ResponseDto;

  beforeEach(async () => {
    // 고정된 Mock 응답 생성 (랜덤 값 방지)
    mockResponseDto = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      title: '테스트 게시글 제목',
      content: {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: '테스트 게시글 내용입니다.'
          }]
        }]
      },
      mainCategory: 'light',
      subCategory: 'introduction',
      description: '테스트 게시글 설명입니다.',
      tags: ['테스트', '태그'],
      topic: '테스트 주제',
      language: 'ko',
      thumbnail: 'thumbnail.jpg',
      authorEmail: 'test@example.com',
      author: '테스트 작성자',
      createdAt: '2025-11-01T00:00:00.000Z',
      updatedAt: '2025-11-01T00:00:00.000Z',
      viewCount: 0,
      likeCount: 0
    } as ResponseDto;

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
   *   content: {
   *     type: 'doc',
   *     content: [{
   *       type: 'paragraph',
   *       content: [{
   *         type: 'text',
   *         text: '테스트 내용'
   *       }]
   *     }]
   *   },
   *   mainCategory: 'light',
   *   subCategory: 'general',
   *   description: '테스트 설명',
   *   tags: ['테스트'],
   *   topic: '테스트 주제'
   * };
   * const authorEmail = 'test@example.com';
   * const result = await service.create(createDto, authorEmail);
   * ```
   */
  describe('create', () => {
    it('should create a new post', async () => {
      // Given
      const authorEmail = 'test@example.com';
      const createDto = MockGenerator.createMock(CreateDto);

      // When
      const result = await service.create(createDto, authorEmail);

      // Then
      expect(mockPostModel.create).toHaveBeenCalledWith({
        ...createDto,
        authorEmail
      });
      expect(result).toEqual(mockResponseDto);
    });

    it('should throw BadRequestException when author email is invalid', async () => {
      // Given
      const invalidEmail = 'invalid-email';
      const createDto = MockGenerator.createMock(CreateDto);

      // When & Then
      await expect(service.create(createDto, invalidEmail)).rejects.toThrow('Invalid author email');
    });
  });

  /**
   * 게시글 목록 조회 테스트
   * 
   * @description
   * 페이지네이션이 적용된 게시글 목록을 조회하고 결과가 올바른지 검증합니다.
   * 
   * @param {string} [mainCategory] - 필터링할 메인 카테고리 (기존 테마)
   * @param {string} [subCategory] - 필터링할 서브 카테고리 (기존 카테고리)
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
      const mainCategory = 'light';
      const subCategory = 'general';
      const page = 1;
      const limit = 10;
      const totalItems = 25;

      mockPostModel.countDocuments.mockResolvedValue(totalItems);

      // When
      const result = await service.findAll(mainCategory, subCategory, page, limit);

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

    it('should not increment view count when viewed is true', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';

      // When
      await service.findOne(id, true);

      // Then
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  /**
   * 게시글 수정용 조회 테스트
   * 
   * @description
   * 게시글 수정을 위한 조회 기능을 테스트합니다.
   * 작성자 권한을 확인하여 본인의 게시글만 조회할 수 있는지 검증합니다.
   * 
   * @param {string} id - 조회할 게시글의 ID
   * @param {string} userEmail - 요청자의 이메일
   * @returns {Promise<ResponseDto>} 수정 권한이 확인된 게시글 정보
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * @throws {ForbiddenException} 작성자가 아닌 사용자가 접근할 경우
   * 
   * @example
   * ```typescript
   * // 정상 케이스 (작성자 본인)
   * const post = await service.findForEdit('507f1f77bcf86cd799439011', 'test@example.com');
   * 
   * // 예외 케이스 (다른 사용자)
   * await service.findForEdit('507f1f77bcf86cd799439011', 'other@example.com');
   * ```
   */
  describe('findForEdit', () => {
    it('should return post for author', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';
      const userEmail = 'test@example.com';
      
      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: id,
          authorEmail: userEmail,
          toObject: () => ({ ...mockResponseDto, authorEmail: userEmail })
        })
      });

      // When
      const result = await service.findForEdit(id, userEmail);

      // Then
      expect(mockPostModel.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expect.objectContaining({
        authorEmail: userEmail
      }));
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';
      const userEmail = 'other@example.com';
      const authorEmail = 'test@example.com';
      
      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: id,
          authorEmail: authorEmail,
          toObject: () => ({ ...mockResponseDto, authorEmail: authorEmail })
        })
      });

      // When & Then
      await expect(service.findForEdit(id, userEmail)).rejects.toThrow(ForbiddenException);
      await expect(service.findForEdit(id, userEmail)).rejects.toThrow('Only the author can edit this post');
    });

    it('should throw NotFoundException for invalid id', async () => {
      // Given
      const id = 'invalid-id';
      const userEmail = 'test@example.com';

      // When & Then
      await expect(service.findForEdit(id, userEmail)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when post not found', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';
      const userEmail = 'test@example.com';
      
      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      // When & Then
      await expect(service.findForEdit(id, userEmail)).rejects.toThrow(NotFoundException);
      await expect(service.findForEdit(id, userEmail)).rejects.toThrow(`Post with ID ${id} not found`);
    });
  });

  /**
   * 게시글 수정 테스트 (업데이트된 권한 체크 포함)
   * 
   * @description
   * 게시글을 수정하고 수정된 정보가 올바른지 검증합니다.
   * 관리자이거나 작성자 본인만 수정할 수 있도록 권한을 검증합니다.
   * 
   * @param {string} id - 수정할 게시글의 ID
   * @param {UpdateDto} updateDto - 수정할 게시글 데이터
   * @param {string} userEmail - 요청자의 이메일
   * @param {string} userRole - 요청자의 역할
   * @returns {Promise<ResponseDto>} 수정된 게시글 정보
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * @throws {ForbiddenException} 수정 권한이 없는 경우
   * 
   * @example
   * ```typescript
   * const updateDto = {
   *   title: '수정된 테스트 게시글',
   *   content: {
   *     type: 'doc',
   *     content: [{
   *       type: 'paragraph',
   *       content: [{
   *         type: 'text',
   *         text: '수정된 테스트 내용'
   *       }]
   *     }]
   *   }
   * };
   * 
   * // 작성자 본인
   * const updatedPost = await service.update('507f1f77bcf86cd799439011', updateDto, 'test@example.com', 'user');
   * 
   * // 관리자
   * const updatedPost = await service.update('507f1f77bcf86cd799439011', updateDto, 'admin@example.com', 'admin');
   * ```
   */
  describe('update', () => {
    it('should update a post by author', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';
      const userEmail = 'test@example.com';
      const userRole = 'user';
      const updateDto = MockGenerator.createMock(UpdateDto);

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: id,
          authorEmail: userEmail
        })
      });

      // When
      const result = await service.update(id, updateDto, userEmail, userRole);

      // Then
      expect(mockPostModel.findById).toHaveBeenCalledWith(id);
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(id, updateDto, { new: true });
      expect(result).toEqual(mockResponseDto);
    });

    it('should update a post by admin', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';
      const userEmail = 'admin@example.com';
      const userRole = 'admin';
      const authorEmail = 'test@example.com';
      const updateDto = MockGenerator.createMock(UpdateDto);

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: id,
          authorEmail: authorEmail
        })
      });

      // When
      const result = await service.update(id, updateDto, userEmail, userRole);

      // Then
      expect(mockPostModel.findById).toHaveBeenCalledWith(id);
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(id, updateDto, { new: true });
      expect(result).toEqual(mockResponseDto);
    });

    it('should throw ForbiddenException when user is not author or admin', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';
      const userEmail = 'other@example.com';
      const userRole = 'user';
      const authorEmail = 'test@example.com';
      const updateDto = MockGenerator.createMock(UpdateDto);

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: id,
          authorEmail: authorEmail
        })
      });

      // When & Then
      await expect(service.update(id, updateDto, userEmail, userRole)).rejects.toThrow(ForbiddenException);
      await expect(service.update(id, updateDto, userEmail, userRole)).rejects.toThrow('Only the author or admin can edit this post');
    });

    it('should update a post without user info (backward compatibility)', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';
      const updateDto = MockGenerator.createMock(UpdateDto);

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: id,
          authorEmail: 'test@example.com'
        })
      });

      // When
      const result = await service.update(id, updateDto);

      // Then
      expect(mockPostModel.findById).toHaveBeenCalledWith(id);
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(id, updateDto, { new: true });
      expect(result).toEqual(mockResponseDto);
    });

    it('should throw NotFoundException for invalid id', async () => {
      // Given
      const id = 'invalid-id';
      const updateDto = MockGenerator.createMock(UpdateDto);

      // When & Then
      await expect(service.update(id, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when post not found', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';
      const updateDto = MockGenerator.createMock(UpdateDto);

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      // When & Then
      await expect(service.update(id, updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(id, updateDto)).rejects.toThrow(`Post with ID ${id} not found`);
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

  /**
   * 게시글 삭제 테스트
   * 
   * @description
   * 게시글을 삭제하고 삭제 작업이 올바르게 수행되는지 검증합니다.
   * 
   * @param {string} id - 삭제할 게시글의 ID
   * @returns {Promise<void>}
   * @throws {NotFoundException} 게시글을 찾을 수 없는 경우
   * 
   * @example
   * ```typescript
   * // 정상 케이스
   * await service.remove('507f1f77bcf86cd799439011');
   * 
   * // 예외 케이스
   * await service.remove('invalid-id');
   * ```
   */
  describe('remove', () => {
    it('should remove a post', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';

      // When
      await service.remove(id);

      // Then
      expect(mockPostModel.findByIdAndDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException for invalid id', async () => {
      // Given
      const id = 'invalid-id';

      // When & Then
      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when post not found', async () => {
      // Given
      const id = '507f1f77bcf86cd799439011';
      mockPostModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      // When & Then
      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * 작성자별 게시글 조회 테스트
   * 
   * @description
   * 특정 작성자의 게시글 목록을 조회하고 결과가 올바른지 검증합니다.
   * 
   * @param {string} authorEmail - 작성자의 이메일
   * @returns {Promise<ResponseDto[]>} 작성자의 게시글 목록
   * 
   * @example
   * ```typescript
   * // 정상 케이스
   * const posts = await service.findByAuthor('test@example.com');
   * 
   * // 존재하지 않는 작성자
   * const posts = await service.findByAuthor('nonexistent@example.com');
   * ```
   */
  describe('findByAuthor', () => {
    it('should return posts by author', async () => {
      // Given
      const authorEmail = 'test@example.com';
      mockPostModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{
          toObject: () => mockResponseDto
        }])
      });

      // When
      const result = await service.findByAuthor(authorEmail);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith({ authorEmail });
      expect(result).toEqual([mockResponseDto]);
    });

    it('should return empty array for non-existent author', async () => {
      // Given
      const authorEmail = 'nonexistent@example.com';
      mockPostModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([])
      });

      // When
      const result = await service.findByAuthor(authorEmail);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith({ authorEmail });
      expect(result).toEqual([]);
    });
  });

  /**
   * 게시글 검색 테스트
   * 
   * @description
   * 키워드로 게시글을 검색하고 결과가 올바른지 검증합니다.
   * 제목과 내용에서 대소문자 구분 없이 키워드를 검색합니다.
   * 
   * @param {string} keyword - 검색할 키워드
   * @returns {Promise<ResponseDto[]>} 검색된 게시글 목록
   * 
   * @example
   * ```typescript
   * // 정상 케이스
   * const posts = await service.searchPosts('test');
   * 
   * // 검색 결과 없음
   * const posts = await service.searchPosts('nonexistent');
   * 
   * // 빈 키워드
   * const posts = await service.searchPosts('');
   * ```
   */
  describe('searchPosts', () => {
    it('should return posts matching keyword', async () => {
      // Given
      const keyword = 'test';
      mockPostModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{
          toObject: () => mockResponseDto
        }])
      });

      // When
      const result = await service.searchPosts(keyword);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { content: { $regex: keyword, $options: 'i' } }
        ]
      });
      expect(result).toEqual([mockResponseDto]);
    });

    it('should return empty array for no matches', async () => {
      // Given
      const keyword = 'nonexistent';
      mockPostModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([])
      });

      // When
      const result = await service.searchPosts(keyword);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { content: { $regex: keyword, $options: 'i' } }
        ]
      });
      expect(result).toEqual([]);
    });

    it('should handle empty keyword', async () => {
      // Given
      const keyword = '';
      mockPostModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([])
      });

      // When
      const result = await service.searchPosts(keyword);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { content: { $regex: keyword, $options: 'i' } }
        ]
      });
      expect(result).toEqual([]);
    });
  });
}); 