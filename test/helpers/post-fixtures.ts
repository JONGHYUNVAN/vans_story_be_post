/**
 * PostsService 단위 테스트용 픽스처와 mongoose 모델 모의 객체
 *
 * - 서비스가 실제로 호출하는 쿼리 체인
 *   (`find/findById/findByIdAndUpdate/... → populate → select → sort → skip → limit → lean → exec`)을
 *   흉내 내는 thenable 쿼리 모의 객체(`mockQuery`)
 * - populate 결과가 포함된 lean 게시글 문서 픽스처(`createPostDocument`)
 * - 서비스 경로별 기대 응답(`expectedEnrichedResponse`, `expectedMainCategoryOnlyResponse`)
 * - Post / Category 모델과 InternalApiClient 모의 객체
 *
 * @module test/helpers/test-utils
 */
import { Types } from 'mongoose';
import { ResponseDto } from 'src/posts/dto';

// ---------------------------------------------------------------- 고정 식별자

export const POST_ID = new Types.ObjectId('507f1f77bcf86cd799439011');
export const MAIN_CATEGORY_ID = new Types.ObjectId('507f1f77bcf86cd799439021');
export const SUB_CATEGORY_ID = new Types.ObjectId('507f1f77bcf86cd799439022');
export const AUTHOR_EMAIL = 'test@example.com';
export const AUTHOR_NICKNAME = '테스트 작성자';
export const FIXED_DATE = new Date('2025-11-01T00:00:00.000Z');

// ---------------------------------------------------------------- 카테고리 픽스처

/** categories 컬렉션 문서 (단위 테스트에 필요한 필드만) */
export interface CategoryFixture {
  _id: Types.ObjectId;
  parentId: Types.ObjectId | null;
  group?: string;
  value: string;
  label: string;
  path: string;
  isActive: boolean;
  sortOrder: number;
}

/** 메인 카테고리 (parentId === null) */
export const mainCategoryDoc: CategoryFixture = {
  _id: MAIN_CATEGORY_ID,
  parentId: null,
  group: 'Frontend',
  value: 'light',
  label: 'Light',
  path: '/light',
  isActive: true,
  sortOrder: 0,
};

/** 서브 카테고리 (parentId === 메인 카테고리 _id) */
export const subCategoryDoc: CategoryFixture = {
  _id: SUB_CATEGORY_ID,
  parentId: MAIN_CATEGORY_ID,
  value: 'introduction',
  label: '소개',
  path: '/light/introduction',
  isActive: true,
  sortOrder: 0,
};

/** `.populate('mainCategoryId', 'value label')` 결과: `_id`와 선택한 필드만 남는다 */
export interface PopulatedCategoryRef {
  _id: Types.ObjectId;
  value: string;
  label: string;
}

export const populatedMainCategory: PopulatedCategoryRef = {
  _id: mainCategoryDoc._id,
  value: mainCategoryDoc.value,
  label: mainCategoryDoc.label,
};

export const populatedSubCategory: PopulatedCategoryRef = {
  _id: subCategoryDoc._id,
  value: subCategoryDoc.value,
  label: subCategoryDoc.label,
};

// ---------------------------------------------------------------- 게시글 픽스처

export const POST_CONTENT = {
  type: 'doc',
  content: [{
    type: 'paragraph',
    content: [{
      type: 'text',
      text: '테스트 게시글 내용입니다.',
    }],
  }],
};

/** `.populate(...).lean()` 을 거친 게시글 문서 */
export interface PostLeanDoc {
  _id: Types.ObjectId;
  title: string;
  content: Record<string, any>;
  description: string;
  tags: string[];
  topic: string;
  language: string;
  thumbnail: string;
  authorEmail: string;
  mainCategoryId: PopulatedCategoryRef;
  subCategoryId: PopulatedCategoryRef;
  viewCount: number;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

/** populate + lean 결과 형태의 게시글 문서를 만든다. 필요한 필드만 `overrides`로 덮어쓴다. */
export const createPostDocument = (overrides: Partial<PostLeanDoc> = {}): PostLeanDoc => ({
  _id: POST_ID,
  title: '테스트 게시글 제목',
  content: POST_CONTENT,
  description: '테스트 게시글 설명입니다.',
  tags: ['테스트', '태그'],
  topic: '테스트 주제',
  language: 'ko',
  thumbnail: 'thumbnail.jpg',
  authorEmail: AUTHOR_EMAIL,
  mainCategoryId: populatedMainCategory,
  subCategoryId: populatedSubCategory,
  viewCount: 0,
  likeCount: 0,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
  __v: 0,
  ...overrides,
});

// ---------------------------------------------------------------- 기대 응답

/**
 * 서비스가 돌려주는 ResponseDto의 실제 런타임 형태.
 *
 * `mapToDto`가 lean 문서의 populate 결과를 그대로 복사하므로, 응답의 `mainCategoryId` / `subCategoryId`는
 * DTO 타입(`Types.ObjectId`)과 달리 `{ _id, value, label }` 서브문서다.
 */
export type PostResponse = Omit<ResponseDto, 'mainCategoryId' | 'subCategoryId'> & {
  mainCategoryId: PopulatedCategoryRef;
  subCategoryId: PopulatedCategoryRef;
};

/**
 * findAll / findOne / findForEdit / update 경로의 기대 응답.
 * 이 경로들은 `author`와 `mainCategory`만 채우고 `mainCategoryLabel` / `subCategory` / `subCategoryLabel`은 넣지 않는다.
 * 날짜는 `mapToDto`가 `Date.toLocaleString()`으로 바꾼 문자열이다.
 */
export const expectedMainCategoryOnlyResponse = (
  doc: PostLeanDoc = createPostDocument(),
): Omit<PostResponse, 'mainCategoryLabel' | 'subCategory' | 'subCategoryLabel'> => ({
  _id: doc._id,
  title: doc.title,
  content: doc.content,
  description: doc.description,
  tags: doc.tags,
  topic: doc.topic,
  language: doc.language,
  thumbnail: doc.thumbnail,
  authorEmail: doc.authorEmail,
  author: AUTHOR_NICKNAME,
  mainCategoryId: doc.mainCategoryId,
  mainCategory: doc.mainCategoryId.value,
  subCategoryId: doc.subCategoryId,
  viewCount: doc.viewCount,
  likeCount: doc.likeCount,
  createdAt: doc.createdAt.toLocaleString(),
  updatedAt: doc.updatedAt.toLocaleString(),
});

/**
 * `enrichPostWithCategoryInfo` 경로(create / findByAuthor / searchPosts / findByThemeAndCategory)의 기대 응답.
 * 메인·서브 카테고리의 value와 label이 모두 채워진다.
 */
export const expectedEnrichedResponse = (doc: PostLeanDoc = createPostDocument()): PostResponse => ({
  ...expectedMainCategoryOnlyResponse(doc),
  mainCategoryLabel: doc.mainCategoryId.label,
  subCategory: doc.subCategoryId.value,
  subCategoryLabel: doc.subCategoryId.label,
});

// ---------------------------------------------------------------- 쿼리 체인 모의 객체

/**
 * mongoose `Query`를 흉내 내는 체인 모의 객체.
 *
 * `populate / select / sort / skip / limit / lean`은 자기 자신을 돌려주고,
 * `exec()` 또는 `await`(thenable)로 `result`를 얻는다.
 */
export const mockQuery = <T>(result: T) => {
  const query = {
    populate: jest.fn(),
    select: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    lean: jest.fn(),
    exec: jest.fn().mockResolvedValue(result),
    then: (onFulfilled?: (value: T) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  query.populate.mockReturnThis();
  query.select.mockReturnThis();
  query.sort.mockReturnThis();
  query.skip.mockReturnThis();
  query.limit.mockReturnThis();
  query.lean.mockReturnThis();
  return query;
};

export type MockQuery<T = any> = ReturnType<typeof mockQuery<T>>;

// ---------------------------------------------------------------- 모델 / 클라이언트 모의 객체

/**
 * Post 모델 모의 객체. 모든 조회 메서드는 호출마다 새 쿼리 체인을 돌려주고,
 * 기본적으로 `doc`(populate + lean 형태)을 결과로 낸다.
 */
export const createMockPostModel = (doc: PostLeanDoc = createPostDocument()) => ({
  create: jest.fn().mockImplementation(async (input: Record<string, unknown>) => ({ _id: doc._id, ...input })),
  find: jest.fn().mockImplementation(() => mockQuery([doc])),
  findById: jest.fn().mockImplementation(() => mockQuery(doc)),
  findByIdAndUpdate: jest.fn().mockImplementation(() => mockQuery(doc)),
  findByIdAndDelete: jest.fn().mockImplementation(() => mockQuery(doc)),
  countDocuments: jest.fn().mockImplementation(() => mockQuery(1)),
});

/** 서비스가 Category 모델에 넘기는 필터 형태 */
interface CategoryFilter {
  value?: string;
  parentId?: Types.ObjectId | null | { $ne: null };
}

const matchesCategory = (doc: CategoryFixture, filter: CategoryFilter): boolean => {
  if (filter.value !== undefined && doc.value !== filter.value) {
    return false;
  }
  if (filter.parentId === undefined) {
    return true;
  }
  if (filter.parentId === null) {
    return doc.parentId === null;
  }
  if ('$ne' in filter.parentId) {
    return doc.parentId !== filter.parentId.$ne;
  }
  return doc.parentId !== null && doc.parentId.equals(filter.parentId);
};

/**
 * Category 모델 모의 객체. `findOne` / `find`는 서비스가 넘기는
 * `{ value, parentId: null | ObjectId | { $ne: null } }` 필터를 실제로 평가한다.
 */
export const createMockCategoryModel = (categories: CategoryFixture[] = [mainCategoryDoc, subCategoryDoc]) => ({
  findOne: jest.fn().mockImplementation((filter: CategoryFilter = {}) =>
    mockQuery(categories.find((category) => matchesCategory(category, filter)) ?? null),
  ),
  find: jest.fn().mockImplementation((filter: CategoryFilter = {}) =>
    mockQuery(categories.filter((category) => matchesCategory(category, filter))),
  ),
  findById: jest.fn().mockImplementation((id: Types.ObjectId | string) =>
    mockQuery(categories.find((category) => category._id.equals(id)) ?? null),
  ),
});

export const createMockApiClient = () => ({
  getUserNickname: jest.fn().mockResolvedValue(AUTHOR_NICKNAME),
});

/** 검색 인덱스 클라이언트는 fire-and-forget 으로 외부 서비스에 fetch 하므로 호출 기록만 남기는 모의 객체로 바꾼다 */
export const createMockSearchIndexClient = () => ({
  indexPost: jest.fn().mockResolvedValue(undefined),
  deletePostIndex: jest.fn().mockResolvedValue(undefined),
});
