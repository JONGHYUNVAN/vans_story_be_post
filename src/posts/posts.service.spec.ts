/**
 * PostsService 단위 테스트
 *
 * Post·Category 모델, UserServiceClient, SearchServiceClient를 모의 객체로 바꿔 DB·네트워크 없이 돈다.
 * 모델 모의 객체는 서비스가 실제로 호출하는 mongoose 쿼리 체인
 * (`findById(...).populate(...).populate(...).lean().exec()` 등)을 그대로 흉내 낸다.
 * 픽스처와 기대 응답은 `test/helpers/post-fixtures.ts`에 있다.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PostsService } from './posts.service';
import { Post } from './schemas/post.schema';
import { Category } from 'src/categories/schemas/category.schema';
import { UserServiceClient } from 'src/user-service/user-service.client';
import { SearchServiceClient } from 'src/search-service/search-service.client';
import { CreatePostDto, UpdatePostDto } from './dto';
import { Role } from 'src/auth/role.enum';
import { createValidDto } from 'test/helpers/dto-fixtures';
import {
  AUTHOR_EMAIL,
  AUTHOR_NICKNAME,
  FIXED_DATE,
  MAIN_CATEGORY_ID,
  POST_ID,
  SUB_CATEGORY_ID,
  createMockUserServiceClient,
  createMockCategoryModel,
  createMockPostModel,
  createMockSearchServiceClient,
  createPostLeanDoc,
  expectedFullResponse,
  MAIN_CATEGORY_DOC,
  createMockQuery,
  SUB_CATEGORY_DOC,
} from 'test/helpers/post-fixtures';

describe('PostsService', () => {
  const POST_ID_HEX = POST_ID.toHexString();

  let service: PostsService;
  let mockPostModel: ReturnType<typeof createMockPostModel>;
  let mockCategoryModel: ReturnType<typeof createMockCategoryModel>;
  let mockUserServiceClient: ReturnType<typeof createMockUserServiceClient>;
  let mockSearchServiceClient: ReturnType<typeof createMockSearchServiceClient>;

  beforeEach(async () => {
    mockPostModel = createMockPostModel();
    mockCategoryModel = createMockCategoryModel();
    mockUserServiceClient = createMockUserServiceClient();
    mockSearchServiceClient = createMockSearchServiceClient();

    const moduleRef: TestingModule = await Test.createTestingModule({
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
          provide: UserServiceClient,
          useValue: mockUserServiceClient,
        },
        {
          provide: SearchServiceClient,
          useValue: mockSearchServiceClient,
        },
      ],
    }).compile();

    service = moduleRef.get<PostsService>(PostsService);
  });

  describe('create', () => {
    it('게시글을 만들어 작성자·카테고리를 채운 응답을 돌려주고 검색 인덱스에 등록한다', async () => {
      // Given
      const createPostDto = createValidDto(CreatePostDto);

      // When
      const result = await service.create(createPostDto, AUTHOR_EMAIL);

      // Then
      expect(mockPostModel.create).toHaveBeenCalledWith({
        ...createPostDto,
        authorEmail: AUTHOR_EMAIL
      });

      // 생성된 _id 로 다시 읽어 카테고리를 populate 한다
      expect(mockPostModel.findById).toHaveBeenCalledWith(POST_ID);
      const query = mockPostModel.findById.mock.results[0].value;
      expect(query.populate).toHaveBeenCalledWith('mainCategoryId', 'value label');
      expect(query.populate).toHaveBeenCalledWith('subCategoryId', 'value label');
      expect(query.lean).toHaveBeenCalled();

      // 작성자 닉네임 + 메인/서브 카테고리 value·label 이 모두 채워진 응답
      expect(mockUserServiceClient.getNicknameByEmail).toHaveBeenCalledWith(AUTHOR_EMAIL);
      expect(result).toEqual(expectedFullResponse());

      // 검색 인덱스 등록 (fire-and-forget)
      expect(mockSearchServiceClient.indexPost).toHaveBeenCalledTimes(1);
      expect(mockSearchServiceClient.indexPost).toHaveBeenCalledWith(expect.objectContaining({
        post_id: POST_ID_HEX,
        title: '테스트 게시글 제목',
        mainCategory: 'light',
        subCategory: 'introduction',
        author: AUTHOR_NICKNAME,
        createdAt: FIXED_DATE.toISOString(),
        updatedAt: FIXED_DATE.toISOString(),
      }));
    });

    it('작성자 이메일 형식이 틀리면 저장하지 않고 400', async () => {
      // Given
      const invalidEmail = 'invalid-email';
      const createPostDto = createValidDto(CreatePostDto);

      // When & Then
      await expect(service.create(createPostDto, invalidEmail)).rejects.toThrow(BadRequestException);
      await expect(service.create(createPostDto, invalidEmail)).rejects.toThrow('Invalid author email');
      expect(mockPostModel.create).not.toHaveBeenCalled();
      expect(mockSearchServiceClient.indexPost).not.toHaveBeenCalled();
    });

    it.each([
      ['없는 메인 카테고리', { mainCategoryId: '507f1f77bcf86cd7994390ff' }],
      ['메인 자리에 서브 카테고리', { mainCategoryId: SUB_CATEGORY_ID.toHexString() }],
      ['없는 서브 카테고리', { subCategoryId: '507f1f77bcf86cd7994390ff' }],
      ['서브 자리에 메인 카테고리', { subCategoryId: MAIN_CATEGORY_ID.toHexString() }],
    ])('%s로 만들면 저장하지 않고 400', async (_, overrides) => {
      // Given
      const createPostDto = createValidDto(CreatePostDto, overrides);

      // When & Then
      await expect(service.create(createPostDto, AUTHOR_EMAIL)).rejects.toThrow(BadRequestException);
      expect(mockPostModel.create).not.toHaveBeenCalled();
      expect(mockSearchServiceClient.indexPost).not.toHaveBeenCalled();
    });

    it('다른 메인 카테고리의 서브 카테고리로 만들면 400', async () => {
      // Given: 부모가 다른 서브 카테고리
      const OTHER_MAIN_ID = new Types.ObjectId('507f1f77bcf86cd799439031');
      const OTHER_SUB_ID = new Types.ObjectId('507f1f77bcf86cd799439032');
      mockCategoryModel.findById.mockImplementation((id: string) =>
        createMockQuery(
          String(id) === OTHER_SUB_ID.toHexString()
            ? { ...SUB_CATEGORY_DOC, _id: OTHER_SUB_ID, parentId: OTHER_MAIN_ID }
            : String(id) === MAIN_CATEGORY_ID.toHexString() ? MAIN_CATEGORY_DOC : null,
        ),
      );
      const createPostDto = createValidDto(CreatePostDto, { subCategoryId: OTHER_SUB_ID.toHexString() });

      // When & Then
      await expect(service.create(createPostDto, AUTHOR_EMAIL)).rejects.toThrow(
        'subCategoryId가 해당 메인 카테고리의 서브 카테고리가 아닙니다.',
      );
      expect(mockPostModel.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('메인·서브 카테고리 value로 거른 페이지를 돌려준다', async () => {
      // Given
      const mainCategory = 'light';
      const subCategory = 'introduction';
      const page = 1;
      const limit = 10;
      const totalItems = 25;

      mockPostModel.countDocuments.mockReturnValue(createMockQuery(totalItems));

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
      expect(result.data).toEqual([expectedFullResponse()]);

      // 페이지네이션 메타 정보 검증
      expect(result.meta).toEqual({
        totalItems: totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        itemsPerPage: limit
      });
    });

    it('카테고리를 주지 않으면 필터 없이 조회한다', async () => {
      // When
      const result = await service.findAll();

      // Then
      expect(mockCategoryModel.findOne).not.toHaveBeenCalled();
      expect(mockCategoryModel.find).not.toHaveBeenCalled();
      expect(mockPostModel.find).toHaveBeenCalledWith({});

      const query = mockPostModel.find.mock.results[0].value;
      expect(query.skip).toHaveBeenCalledWith(0);
      expect(query.limit).toHaveBeenCalledWith(10);

      expect(result.data).toEqual([expectedFullResponse()]);
      expect(result.meta).toEqual({ totalItems: 1, currentPage: 1, totalPages: 1, itemsPerPage: 10 });
    });

    it('없는 메인 카테고리면 빈 페이지', async () => {
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

  describe('findOne', () => {
    it('게시글을 돌려주고 조회수를 올린다', async () => {
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
      expect(mockUserServiceClient.getNicknameByEmail).toHaveBeenCalledWith(AUTHOR_EMAIL);
      expect(result).toEqual(expectedFullResponse());
    });

    it('이미 본 게시글이면 조회수를 올리지 않는다', async () => {
      // When
      const result = await service.findOne(POST_ID_HEX, true);

      // Then
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(result).toEqual(expectedFullResponse());
    });
  });

  describe('findForEdit', () => {
    it('작성자에게 게시글을 돌려준다', async () => {
      // Given
      const userEmail = AUTHOR_EMAIL;
      mockPostModel.findById.mockReturnValue(createMockQuery(createPostLeanDoc({ authorEmail: userEmail })));

      // When
      const result = await service.findForEdit(POST_ID_HEX, userEmail);

      // Then
      expect(mockPostModel.findById).toHaveBeenCalledWith(POST_ID_HEX);
      expect(result).toEqual(expectedFullResponse(createPostLeanDoc({ authorEmail: userEmail })));
      expect(result.authorEmail).toBe(userEmail);
      // 조회수는 증가시키지 않는다
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('작성자가 아니면 403', async () => {
      // Given
      const userEmail = 'other@example.com';
      const authorEmail = AUTHOR_EMAIL;
      mockPostModel.findById.mockReturnValue(createMockQuery(createPostLeanDoc({ authorEmail })));

      // When & Then
      await expect(service.findForEdit(POST_ID_HEX, userEmail)).rejects.toThrow(ForbiddenException);
      await expect(service.findForEdit(POST_ID_HEX, userEmail)).rejects.toThrow('Only the author can edit this post');
    });

    it('게시글이 없으면 404', async () => {
      // Given
      mockPostModel.findById.mockReturnValue(createMockQuery(null));

      // When & Then
      await expect(service.findForEdit(POST_ID_HEX, AUTHOR_EMAIL)).rejects.toThrow(NotFoundException);
      await expect(service.findForEdit(POST_ID_HEX, AUTHOR_EMAIL)).rejects.toThrow(`Post with ID ${POST_ID_HEX} not found`);
    });
  });

  describe('update', () => {
    it('작성자 본인은 수정할 수 있다', async () => {
      // Given
      const userEmail = AUTHOR_EMAIL;
      const updatePostDto = createValidDto(UpdatePostDto);

      mockPostModel.findById.mockReturnValue(createMockQuery(createPostLeanDoc({ authorEmail: userEmail })));

      // When
      const result = await service.update(POST_ID_HEX, updatePostDto, userEmail, [Role.User]);

      // Then
      expect(mockPostModel.findById).toHaveBeenCalledWith(POST_ID_HEX);
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(POST_ID_HEX, updatePostDto, { new: true, runValidators: true });

      const query = mockPostModel.findByIdAndUpdate.mock.results[0].value;
      expect(query.populate).toHaveBeenCalledWith('mainCategoryId', 'value label');
      expect(query.populate).toHaveBeenCalledWith('subCategoryId', 'value label');

      // 수정 응답도 author 와 mainCategory 만 채운다
      expect(result).toEqual(expectedFullResponse());

      // 검색 인덱스 갱신 (fire-and-forget)
      expect(mockSearchServiceClient.indexPost).toHaveBeenCalledTimes(1);
      expect(mockSearchServiceClient.indexPost).toHaveBeenCalledWith(expect.objectContaining({
        post_id: POST_ID_HEX,
        mainCategory: 'light',
        subCategory: 'introduction',
        author: AUTHOR_NICKNAME,
      }));
    });

    it('관리자는 다른 사람의 글도 수정할 수 있다', async () => {
      // Given
      const updatePostDto = createValidDto(UpdatePostDto);

      mockPostModel.findById.mockReturnValue(createMockQuery(createPostLeanDoc({ authorEmail: AUTHOR_EMAIL })));

      // When
      const result = await service.update(POST_ID_HEX, updatePostDto, 'admin@example.com', [Role.User, Role.Admin]);

      // Then
      expect(mockPostModel.findById).toHaveBeenCalledWith(POST_ID_HEX);
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(POST_ID_HEX, updatePostDto, { new: true, runValidators: true });
      expect(result).toEqual(expectedFullResponse());
    });

    it('작성자도 관리자도 아니면 403', async () => {
      // Given
      const updatePostDto = createValidDto(UpdatePostDto);

      mockPostModel.findById.mockReturnValue(createMockQuery(createPostLeanDoc({ authorEmail: AUTHOR_EMAIL })));

      // When & Then
      const update = () => service.update(POST_ID_HEX, updatePostDto, 'other@example.com', [Role.User]);
      await expect(update()).rejects.toThrow(ForbiddenException);
      await expect(update()).rejects.toThrow('Only the author or admin can edit this post');
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(mockSearchServiceClient.indexPost).not.toHaveBeenCalled();
    });

    it.each([
      ['이메일이 없으면', '', [Role.Admin]],
      ['역할이 없으면', AUTHOR_EMAIL, []],
      ['역할 목록 자체가 없으면', AUTHOR_EMAIL, undefined],
    ])('%s 게시글을 조회하지 않고 403 (fail-closed)', async (_, userEmail, userRoles) => {
      // Given
      const updatePostDto = createValidDto(UpdatePostDto);

      // When & Then
      await expect(
        service.update(POST_ID_HEX, updatePostDto, userEmail, userRoles as Role[]),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPostModel.findById).not.toHaveBeenCalled();
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('게시글이 없으면 404', async () => {
      // Given
      const updatePostDto = createValidDto(UpdatePostDto);

      mockPostModel.findById.mockReturnValue(createMockQuery(null));

      // When & Then
      const update = () => service.update(POST_ID_HEX, updatePostDto, AUTHOR_EMAIL, [Role.User]);
      await expect(update()).rejects.toThrow(NotFoundException);
      await expect(update()).rejects.toThrow(`Post with ID ${POST_ID_HEX} not found`);
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('서브 카테고리만 바꿔도 기존 메인과의 조합을 확인해 맞지 않으면 400', async () => {
      // Given: 기존 글의 메인은 MAIN_CATEGORY_ID, 바꾸려는 서브는 메인 카테고리
      mockPostModel.findById.mockReturnValue(createMockQuery(createPostLeanDoc({ authorEmail: AUTHOR_EMAIL })));

      // When & Then
      await expect(
        service.update(POST_ID_HEX, { subCategoryId: MAIN_CATEGORY_ID.toHexString() }, AUTHOR_EMAIL, [Role.User]),
      ).rejects.toThrow(BadRequestException);
      expect(mockPostModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('카테고리를 바꾸지 않으면 카테고리를 조회하지 않는다', async () => {
      // Given
      mockPostModel.findById.mockReturnValue(createMockQuery(createPostLeanDoc({ authorEmail: AUTHOR_EMAIL })));

      // When
      await service.update(POST_ID_HEX, { title: '새 제목' }, AUTHOR_EMAIL, [Role.User]);

      // Then
      expect(mockCategoryModel.findById).not.toHaveBeenCalled();
    });
  });

  describe('incrementViewCount', () => {
    it('조회수를 1 올린다', async () => {
      // Given
      mockPostModel.findByIdAndUpdate.mockReturnValue(createMockQuery(createPostLeanDoc({ viewCount: 1 })));

      // When
      await service.incrementViewCount(POST_ID_HEX);

      // Then
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        POST_ID_HEX,
        { $inc: { viewCount: 1 } },
        { new: true }
      );
    });

    it('게시글이 없으면 404', async () => {
      // Given
      mockPostModel.findByIdAndUpdate.mockReturnValue(createMockQuery(null));

      // When & Then
      await expect(service.incrementViewCount(POST_ID_HEX)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('게시글을 지우고 검색 인덱스에서 뺀다', async () => {
      // When
      await service.remove(POST_ID_HEX);

      // Then
      expect(mockPostModel.findByIdAndDelete).toHaveBeenCalledWith(POST_ID_HEX);
      expect(mockSearchServiceClient.removePostFromIndex).toHaveBeenCalledWith(POST_ID_HEX);
    });

    it('게시글이 없으면 404', async () => {
      // Given
      mockPostModel.findByIdAndDelete.mockReturnValue(createMockQuery(null));

      // When & Then
      await expect(service.remove(POST_ID_HEX)).rejects.toThrow(NotFoundException);
      expect(mockSearchServiceClient.removePostFromIndex).not.toHaveBeenCalled();
    });
  });

  describe('findByAuthor', () => {
    it('작성자의 게시글을 돌려준다', async () => {
      // Given
      const authorEmail = AUTHOR_EMAIL;
      mockPostModel.find.mockReturnValue(createMockQuery([createPostLeanDoc({ authorEmail })]));

      // When
      const result = await service.findByAuthor(authorEmail);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith({ authorEmail });
      const query = mockPostModel.find.mock.results[0].value;
      expect(query.populate).toHaveBeenCalledWith('mainCategoryId', 'value label');
      expect(query.populate).toHaveBeenCalledWith('subCategoryId', 'value label');
      expect(result).toEqual([expectedFullResponse()]);
    });

    it('없는 작성자면 빈 배열', async () => {
      // Given
      const authorEmail = 'nonexistent@example.com';
      mockPostModel.find.mockReturnValue(createMockQuery([]));

      // When
      const result = await service.findByAuthor(authorEmail);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith({ authorEmail });
      expect(mockUserServiceClient.getNicknameByEmail).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('searchPosts', () => {
    const keywordFilter = (keyword: string) => ({
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } }
      ]
    });

    it('키워드가 제목이나 본문에 맞는 게시글을 돌려준다', async () => {
      // Given
      const keyword = 'test';
      mockPostModel.find.mockReturnValue(createMockQuery([createPostLeanDoc()]));

      // When
      const result = await service.searchPosts(keyword);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith(keywordFilter(keyword));
      expect(result).toEqual([expectedFullResponse()]);
    });

    it('맞는 게시글이 없으면 빈 배열', async () => {
      // Given
      const keyword = 'nonexistent';
      mockPostModel.find.mockReturnValue(createMockQuery([]));

      // When
      const result = await service.searchPosts(keyword);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith(keywordFilter(keyword));
      expect(result).toEqual([]);
    });

    it('빈 키워드도 같은 필터로 조회한다', async () => {
      // Given
      const keyword = '';
      mockPostModel.find.mockReturnValue(createMockQuery([]));

      // When
      const result = await service.searchPosts(keyword);

      // Then
      expect(mockPostModel.find).toHaveBeenCalledWith(keywordFilter(keyword));
      expect(result).toEqual([]);
    });
  });
});
