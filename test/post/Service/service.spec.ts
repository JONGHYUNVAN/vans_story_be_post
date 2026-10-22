/**
 * PostsService 단위 테스트
 *
 * @module test/Service/service.spec
 * @description
 * 게시글 서비스의 모든 기능에 대한 단위 테스트를 수행합니다.
 * 각 메서드별로 정상 케이스와 예외 케이스를 테스트하며,
 * MongoDB 모델(Post / Category)과 API 클라이언트, 검색 인덱스 클라이언트를 모킹하여
 * 독립적인 테스트를 보장합니다.
 *
 * 모델 모의 객체는 서비스가 실제로 호출하는 mongoose 쿼리 체인
 * (`findById(...).populate(...).populate(...).lean().exec()` 등)을 그대로 흉내 냅니다.
 * 픽스처와 기대 응답은 `test/helpers/test-utils.ts`에 있습니다.
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
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PostsService } from '../../../src/modules/post/Service/service';
import { Post } from '../../../src/modules/post/schemas/post.schema';
import { Category } from '../../../src/modules/category/schemas/category.schema';
import { InternalApiClient } from '../../../src/utils/Api/api';
import { SearchIndexClient } from '../../../src/utils/Api/search-index.client';
import { CreateDto, UpdateDto } from '../../../src/modules/post/DTO';
import { Role } from 'src/utils/Authorization/role.enum';
import { MockGenerator } from '../../helpers/mock-generator';
import {
  AUTHOR_EMAIL,
  AUTHOR_NICKNAME,
  FIXED_DATE,
  MAIN_CATEGORY_ID,
  POST_ID,
  SUB_CATEGORY_ID,
  createMockApiClient,
  createMockCategoryModel,
  createMockPostModel,
  createMockSearchIndexClient,
  createPostDocument,
  expectedEnrichedResponse,
  expectedMainCategoryOnlyResponse,
  mainCategoryDoc,
  mockQuery,
  subCategoryDoc,
} from '../../helpers/test-utils';

describe('PostsService', () => {
  const POST_ID_HEX = POST_ID.toHexString();

  let service: PostsService;
  let mockPostModel: ReturnType<typeof createMockPostModel>;
  let mockCategoryModel: ReturnType<typeof createMockCategoryModel>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;
  let mockSearchIndex: ReturnType<typeof createMockSearchIndexClient>;

  beforeEach(async () => {
    mockPostModel = createMockPostModel();
    mockCategoryModel = createMockCategoryModel();
    mockApiClient = createMockApiClient();
    mockSearchIndex = createMockSearchIndexClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getModelToken(Post.name),
          useValue: mockPostModel,
        },
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
        {
          provide: InternalApiClient,
          useValue: mockApiClient,
        },
        {
          provide: SearchIndexClient,
          useValue: mockSearchIndex,
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
   * 생성 후 populate 된 문서를 다시 읽어 카테고리 value / label 과 작성자 닉네임을 채우고,
   * 검색 인덱스 등록을 fire-and-forget 으로 요청합니다.
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
   *   mainCategoryId: '507f1f77bcf86cd799439021',
   *   subCategoryId: '507f1f77bcf86cd799439022',
   *   description: '테스트 설명',
   *   tags: ['테스트'],
   *   topic: '테스트 주제',
   *   language: 'ko'
   * };
   * const authorEmail = 'test@example.com';
   * const result = await service.create(createDto, authorEmail);
   * ```
   */
  describe('create', () => {
    it('should create a new post', async () => {
      // Given
      const createDto = MockGenerator.createMock(CreateDto);

      // When
      const result = await service.create(createDto, AUTHOR_EMAIL);

      // Then
      expect(mockPostModel.create).toHaveBeenCalledWith({
        ...createDto,
        authorEmail: AUTHOR_EMAIL
      });

      // 생성된 _id 로 다시 읽어 카테고리를 populate 한다
      expect(mockPostModel.findById).toHaveBeenCalledWith(POST_ID);
      const query = mockPostModel.findById.mock.results[0].value;
      expect(query.populate).toHaveBeenCalledWith('mainCategoryId', 'value label');
      expect(query.populate).toHaveBeenCalledWith('subCategoryId', 'value label');
      expect(query.lean).toHaveBeenCalled();

      // 작성자 닉네임 + 메인/서브 카테고리 value·label 이 모두 채워진 응답
      expect(mockApiClient.getUserNickname).toHaveBeenCalledWith(AUTHOR_EMAIL);
      expect(result).toEqual(expectedEnrichedResponse());

      // 검색 인덱스 등록 (fire-and-forget)
      expect(mockSearchIndex.indexPost).toHaveBeenCalledTimes(1);
      expect(mockSearchIndex.indexPost).toHaveBeenCalledWith(expect.objectContaining({
        post_id: POST_ID_HEX,
        title: '테스트 게시글 제목',
        mainCategory: 'light',
        subCategory: 'introduction',
        author: AUTHOR_NICKNAME,
        createdAt: FIXED_DATE.toISOString(),
        updatedAt: FIXED_DATE.toISOString(),
      }));
    });

    it('should throw BadRequestException when author email is invalid', async () => {
      // Given
      const invalidEmail = 'invalid-email';
      const createDto = MockGenerator.createMock(CreateDto);

      // When & Then
      await expect(service.create(createDto, invalidEmail)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, invalidEmail)).rejects.toThrow('Invalid author email');
      expect(mockPostModel.create).not.toHaveBeenCalled();
      expect(mockSearchIndex.indexPost).not.toHaveBeenCalled();
    });

    it.each([
      ['없는 메인 카테고리', { mainCategoryId: '507f1f77bcf86cd7994390ff' }],
      ['메인 자리에 서브 카테고리', { mainCategoryId: SUB_CATEGORY_ID.toHexString() }],
      ['없는 서브 카테고리', { subCategoryId: '507f1f77bcf86cd7994390ff' }],
      ['서브 자리에 메인 카테고리', { subCategoryId: MAIN_CATEGORY_ID.toHexString() }],
    ])('%s로 만들면 저장하지 않고 400', async (_, overrides) => {
      // Given
      const createDto = MockGenerator.createMock(CreateDto, overrides);

      // When & Then
      await expect(service.create(createDto, AUTHOR_EMAIL)).rejects.toThrow(BadRequestException);
      expect(mockPostModel.create).not.toHaveBeenCalled();
      expect(mockSearchIndex.indexPost).not.toHaveBeenCalled();
    });

    it('다른 메인 카테고리의 서브 카테고리로 만들면 400', async () => {
      // Given: 부모가 다른 서브 카테고리
      const OTHER_MAIN_ID = new Types.ObjectId('507f1f77bcf86cd799439031');
      const OTHER_SUB_ID = new Types.ObjectId('507f1f77bcf86cd799439032');
      mockCategoryModel.findById.mockImplementation((id: string) =>
        mockQuery(
          String(id) === OTHER_SUB_ID.toHexString()
            ? { ...subCategoryDoc, _id: OTHER_SUB_ID, parentId: OTHER_MAIN_ID }
            : String(id) === MAIN_CATEGORY_ID.toHexString() ? mainCategoryDoc : null,
        ),
      );
      const createDto = MockGenerator.createMock(CreateDto, { subCategoryId: OTHER_SUB_ID.toHexString() });

      // When & Then
      await expect(service.create(createDto, AUTHOR_EMAIL)).rejects.toThrow(
        'subCategoryId가 해당 메인 카테고리의 서브 카테고리가 아닙니다.',
      );
      expect(mockPostModel.create).not.toHaveBeenCalled();
    });
  });

  /**
   * 게시글 목록 조회 테스트
   *
   * @description
   * 페이지네이션이 적용된 게시글 목록을 조회하고 결과가 올바른지 검증합니다.
   * 카테고리 value 는 Category 컬렉션에서 ObjectId 로 변환한 뒤 Post 필터에 사용됩니다.
   *
   * @param {string} [mainCategoryValue] - 필터링할 메인 카테고리 value
   * @param {string} [subCategoryValue] - 필터링할 서브 카테고리 value
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
   * const result = await service.findAll('light', 'introduction', 1, 10);
   * ```
   */
  describe('findAll', () => {
    it('should return paginated posts filtered by main and sub category', async () => {
      // Given
      const mainCategory = 'light';
      const subCategory = 'introduction';
      const page = 1;
      const limit = 10;
      const totalItems = 25;

      mockPostModel.countDocuments.mockReturnValue(mockQuery(totalItems));

      // When
      const result = await service.findAll(mainCategory, subCategory, page, limit);

      // Then
      // 카테고리 value → ObjectId 변환 (서브 카테고리는 메인 카테고리의 자식이어야 한다)
      expect(mockCategoryModel.findOne).toHaveBeenNthCalledWith(1, { value: mainCategory, parentId: null });
      expect(mockCategoryModel.findOne).toHaveBeenNthCalledWith(2, { value: subCategory, parentId: MAIN_CATEGORY_ID });

      const filter = { mainCategoryId: MAIN_CATEGORY_ID, subCategoryId: SUB_CATEGORY_ID };
      expect(mockPostModel.find).toHaveBeenCalledWith(filter);
      expect(mockPostModel.countDocuments).toHaveBeenCalledWith(filter);

      // 목록은 content 를 제외하고 최신순으로 페이지네이션한다
      const query = mockPostModel.find.mock.results[0].value;
      expect(query.select).toHaveBeenCalledWith('-content');
      expect(query.populate).toHaveBeenCalledWith('mainCategoryId', 'value label');
      expect(query.populate).toHaveBeenCalledWith('subCategoryId', 'value label');
      expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(query.skip).toHaveBeenCalledWith((page - 1) * limit);
      expect(query.limit).toHaveBeenCalledWith(limit);

      // 목록 응답은 author 와 mainCategory 만 채운다 (label / subCategory 는 없음)
      expect(result.data).toEqual([expectedMainCategoryOnlyResponse()]);

      // 페이지네이션 메타 정보 검증
      expect(result.meta).toEqual({
        totalItems: totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        itemsPerPage: limit
      });
    });

    it('should query without category filter when none is given', async () => {
      // When
      const result = await service.findAll();

      // Then
      expect(mockCategoryModel.findOne).not.toHaveBeenCalled();
      expect(mockCategoryModel.find).not.toHaveBeenCalled();
      expect(mockPostModel.find).toHaveBeenCalledWith({});

      const query = mockPostModel.find.mock.results[0].value;
      expect(query.skip).toHaveBeenCalledWith(0);
      expect(query.limit).toHaveBeenCalledWith(10);

      expect(result.data).toEqual([expectedMainCategoryOnlyResponse()]);
      expect(result.meta).toEqual({ totalItems: 1, currentPage: 1, totalPages: 1, itemsPerPage: 10 });
    });

    it('should return an empty page when the main category does not exist', async () => {
      // When
      const result = await service.findAll('unknown', undefined, 2, 5);

      // Then
      expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ value: 'unknown', parentId: null });
      expect(mockPostModel.find).not.toHaveBeenCalled();
      expect(result).toEqual({
        data: [],
        meta: { totalItems: 0, currentPage: 2, totalPages: 0, itemsPerPage: 5 }
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
    it('should return a post by id and increment the view count', async () => {
      // When
      const result = await service.findOne(POST_ID_HEX);

      // Then
      expect(mockPostModel.findById).toHaveBeenCalledWith(POST_ID_HEX);
      const query = mockPostModel.findById.mock.results[0].value;
      expect(query.populate).toHaveBeenCalledWith('mainCategoryId', 'value label');
      expect(query.populate).toHaveBeenCalledWith('subCategoryId', 'value label');

      // viewed 가 false 이면 조회수를 1 증가시킨다
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        POST_ID_HEX,
        { $inc: { viewCount: 1 } },
        { new: true }
      );

      // 응답은 조회수를 증가시키기 전에 읽은 문서 기준이다 (viewCount: 0)
      expect(mockApiClient.getUserNickname).toHaveBeenCalledWith(AUTHOR_EMAIL);
      expect(result).toEqual(expectedMainCategoryOnlyResponse());
    });

    it('should not increment view count when viewed is true', async () => {
      // When
      const result = await service.findOne(POST_ID_HEX, true);

      // Then
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(result).toEqual(expectedMainCategoryOnlyResponse());
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
      const userEmail = AUTHOR_EMAIL;
      mockPostModel.findById.mockReturnValue(mockQuery(createPostDocument({ authorEmail: userEmail })));

      // When
      const result = await service.findForEdit(POST_ID_HEX, userEmail);

      // Then
      expect(mockPostModel.findById).toHaveBeenCalledWith(POST_ID_HEX);
      expect(result).toEqual(expectedMainCategoryOnlyResponse(createPostDocument({ authorEmail: userEmail })));
      expect(result.authorEmail).toBe(userEmail);
      // 조회수는 증가시키지 않는다
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      // Given
      const userEmail = 'other@example.com';
      const authorEmail = AUTHOR_EMAIL;
      mockPostModel.findById.mockReturnValue(mockQuery(createPostDocument({ authorEmail })));

      // When & Then
      await expect(service.findForEdit(POST_ID_HEX, userEmail)).rejects.toThrow(ForbiddenException);
      await expect(service.findForEdit(POST_ID_HEX, userEmail)).rejects.toThrow('Only the author can edit this post');
    });

    it('should throw NotFoundException when post not found', async () => {
      // Given
      mockPostModel.findById.mockReturnValue(mockQuery(null));

      // When & Then
      await expect(service.findForEdit(POST_ID_HEX, AUTHOR_EMAIL)).rejects.toThrow(NotFoundException);
      await expect(service.findForEdit(POST_ID_HEX, AUTHOR_EMAIL)).rejects.toThrow(`Post with ID ${POST_ID_HEX} not found`);
    });
  });

  /**
   * 게시글 수정 테스트 (업데이트된 권한 체크 포함)
   *
   * @description
   * 게시글을 수정하고 수정된 정보가 올바른지 검증합니다.
   * 관리자이거나 작성자 본인만 수정할 수 있도록 권한을 검증합니다.
   * 수정 후에는 검색 인덱스 갱신을 fire-and-forget 으로 요청합니다.
   *
   * @param {string} id - 수정할 게시글의 ID
   * @param {UpdateDto} updateDto - 수정할 게시글 데이터
   * @param {string} userEmail - 요청자의 이메일
   * @param {Role[]} userRoles - 요청자의 역할
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
   * const updatedPost = await service.update('507f1f77bcf86cd799439011', updateDto, 'test@example.com', [Role.User]);
   *
   * // 관리자
   * const updatedPost = await service.update('507f1f77bcf86cd799439011', updateDto, 'admin@example.com', [Role.Admin]);
   * ```
   */
  describe('update', () => {
    it('작성자 본인은 수정할 수 있다', async () => {
      // Given
      const userEmail = AUTHOR_EMAIL;
      const updateDto = MockGenerator.createMock(UpdateDto);

      mockPostModel.findById.mockReturnValue(mockQuery(createPostDocument({ authorEmail: userEmail })));

      // When
      const result = await service.update(POST_ID_HEX, updateDto, userEmail, [Role.User]);

      // Then
      expect(mockPostModel.findById).toHaveBeenCalledWith(POST_ID_HEX);
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(POST_ID_HEX, updateDto, { new: true, runValidators: true });

      const query = mockPostModel.findByIdAndUpdate.mock.results[0].value;
      expect(query.populate).toHaveBeenCalledWith('mainCategoryId', 'value label');
      expect(query.populate).toHaveBeenCalledWith('subCategoryId', 'value label');

      // 수정 응답도 author 와 mainCategory 만 채운다
      expect(result).toEqual(expectedMainCategoryOnlyResponse());

      // 검색 인덱스 갱신 (fire-and-forget)
      expect(mockSearchIndex.indexPost).toHaveBeenCalledTimes(1);
      expect(mockSearchIndex.indexPost).toHaveBeenCalledWith(expect.objectContaining({
        post_id: POST_ID_HEX,
        mainCategory: 'light',
        subCategory: 'introduction',
        author: AUTHOR_NICKNAME,
      }));
    });

    it('관리자는 다른 사람의 글도 수정할 수 있다', async () => {
      // Given
      const updateDto = MockGenerator.createMock(UpdateDto);

      mockPostModel.findById.mockReturnValue(mockQuery(createPostDocument({ authorEmail: AUTHOR_EMAIL })));

      // When
      const result = await service.update(POST_ID_HEX, updateDto, 'admin@example.com', [Role.User, Role.Admin]);

      // Then
      expect(mockPostModel.findById).toHaveBeenCalledWith(POST_ID_HEX);
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(POST_ID_HEX, updateDto, { new: true, runValidators: true });
      expect(result).toEqual(expectedMainCategoryOnlyResponse());
    });

    it('작성자도 관리자도 아니면 403', async () => {
      // Given
      const updateDto = MockGenerator.createMock(UpdateDto);

      mockPostModel.findById.mockReturnValue(mockQuery(createPostDocument({ authorEmail: AUTHOR_EMAIL })));

      // When & Then
      const update = () => service.update(POST_ID_HEX, updateDto, 'other@example.com', [Role.User]);
      await expect(update()).rejects.toThrow(ForbiddenException);
      await expect(update()).rejects.toThrow('Only the author or admin can edit this post');
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(mockSearchIndex.indexPost).not.toHaveBeenCalled();
    });

    it.each([
      ['이메일이 없으면', '', [Role.Admin]],
      ['역할이 없으면', AUTHOR_EMAIL, []],
      ['역할 목록 자체가 없으면', AUTHOR_EMAIL, undefined],
    ])('%s 게시글을 조회하지 않고 403 (fail-closed)', async (_, userEmail, userRoles) => {
      // Given
      const updateDto = MockGenerator.createMock(UpdateDto);

      // When & Then
      await expect(
        service.update(POST_ID_HEX, updateDto, userEmail, userRoles as Role[]),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPostModel.findById).not.toHaveBeenCalled();
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('게시글이 없으면 404', async () => {
      // Given
      const updateDto = MockGenerator.createMock(UpdateDto);

      mockPostModel.findById.mockReturnValue(mockQuery(null));

      // When & Then
      const update = () => service.update(POST_ID_HEX, updateDto, AUTHOR_EMAIL, [Role.User]);
      await expect(update()).rejects.toThrow(NotFoundException);
      await expect(update()).rejects.toThrow(`Post with ID ${POST_ID_HEX} not found`);
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('서브 카테고리만 바꿔도 기존 메인과의 조합을 확인해 맞지 않으면 400', async () => {
      // Given: 기존 글의 메인은 MAIN_CATEGORY_ID, 바꾸려는 서브는 메인 카테고리
      mockPostModel.findById.mockReturnValue(mockQuery(createPostDocument({ authorEmail: AUTHOR_EMAIL })));

      // When & Then
      await expect(
        service.update(POST_ID_HEX, { subCategoryId: MAIN_CATEGORY_ID.toHexString() }, AUTHOR_EMAIL, [Role.User]),
      ).rejects.toThrow(BadRequestException);
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('카테고리를 바꾸지 않으면 카테고리를 조회하지 않는다', async () => {
      // Given
      mockPostModel.findById.mockReturnValue(mockQuery(createPostDocument({ authorEmail: AUTHOR_EMAIL })));

      // When
      await service.update(POST_ID_HEX, { title: '새 제목' }, AUTHOR_EMAIL, [Role.User]);

      // Then
      expect(mockCategoryModel.findById).not.toHaveBeenCalled();
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
      mockPostModel.findByIdAndUpdate.mockReturnValue(mockQuery(createPostDocument({ viewCount: 1 })));

      // When
      await service.incrementViewCount(POST_ID_HEX);

      // Then
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        POST_ID_HEX,
        { $inc: { viewCount: 1 } },
        { new: true }
      );
    });

    it('should throw NotFoundException when post not found', async () => {
      // Given
      mockPostModel.findByIdAndUpdate.mockReturnValue(mockQuery(null));

      // When & Then
      await expect(service.incrementViewCount(POST_ID_HEX)).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * 게시글 삭제 테스트
   *
   * @description
   * 게시글을 삭제하고 삭제 작업이 올바르게 수행되는지 검증합니다.
   * 삭제 후에는 검색 인덱스 삭제를 fire-and-forget 으로 요청합니다.
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
      // When
      await service.remove(POST_ID_HEX);

      // Then
      expect(mockPostModel.findByIdAndDelete).toHaveBeenCalledWith(POST_ID_HEX);
      expect(mockSearchIndex.deletePostIndex).toHaveBeenCalledWith(POST_ID_HEX);
    });

    it('should throw NotFoundException when post not found', async () => {
      // Given
      mockPostModel.findByIdAndDelete.mockReturnValue(mockQuery(null));

      // When & Then
      await expect(service.remove(POST_ID_HEX)).rejects.toThrow(NotFoundException);
      expect(mockSearchIndex.deletePostIndex).not.toHaveBeenCalled();
    });
  });

  /**
   * 작성자별 게시글 조회 테스트
   *
   * @description
   * 특정 작성자의 게시글 목록을 조회하고 결과가 올바른지 검증합니다.
   * 이 경로는 메인·서브 카테고리의 value 와 label 을 모두 채웁니다.
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
      const authorEmail = AUTHOR_EMAIL;
      mockPostModel.find.mockReturnValue(mockQuery([createPostDocument({ authorEmail })]));

      // When
      const result = await service.findByAuthor(authorEmail);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith({ authorEmail });
      const query = mockPostModel.find.mock.results[0].value;
      expect(query.populate).toHaveBeenCalledWith('mainCategoryId', 'value label');
      expect(query.populate).toHaveBeenCalledWith('subCategoryId', 'value label');
      expect(result).toEqual([expectedEnrichedResponse()]);
    });

    it('should return empty array for non-existent author', async () => {
      // Given
      const authorEmail = 'nonexistent@example.com';
      mockPostModel.find.mockReturnValue(mockQuery([]));

      // When
      const result = await service.findByAuthor(authorEmail);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith({ authorEmail });
      expect(mockApiClient.getUserNickname).not.toHaveBeenCalled();
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
    const keywordFilter = (keyword: string) => ({
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } }
      ]
    });

    it('should return posts matching keyword', async () => {
      // Given
      const keyword = 'test';
      mockPostModel.find.mockReturnValue(mockQuery([createPostDocument()]));

      // When
      const result = await service.searchPosts(keyword);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith(keywordFilter(keyword));
      expect(result).toEqual([expectedEnrichedResponse()]);
    });

    it('should return empty array for no matches', async () => {
      // Given
      const keyword = 'nonexistent';
      mockPostModel.find.mockReturnValue(mockQuery([]));

      // When
      const result = await service.searchPosts(keyword);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith(keywordFilter(keyword));
      expect(result).toEqual([]);
    });

    it('should handle empty keyword', async () => {
      // Given
      const keyword = '';
      mockPostModel.find.mockReturnValue(mockQuery([]));

      // When
      const result = await service.searchPosts(keyword);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith(keywordFilter(keyword));
      expect(result).toEqual([]);
    });
  });
});
