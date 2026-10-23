import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { faker } from '@faker-js/faker/locale/ko';
import { CreatePostDto, UpdatePostDto } from 'src/posts/dto';
import { MAIN_CATEGORY_ID, SUB_CATEGORY_ID } from './post-fixtures';

type PostDtoClass = typeof CreatePostDto | typeof UpdatePostDto;

/** class-validator를 통과하는 게시글 생성·수정 본문. 카테고리 id는 픽스처 카테고리를 가리킨다 */
const validPostBody = () => ({
  title: faker.lorem.sentence().slice(0, 100),
  content: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: faker.lorem.paragraphs() }],
      },
    ],
  },
  mainCategoryId: MAIN_CATEGORY_ID.toHexString(),
  subCategoryId: SUB_CATEGORY_ID.toHexString(),
  description: faker.lorem.paragraph().slice(0, 500),
  tags: [faker.lorem.word(), faker.lorem.word()],
  topic: faker.lorem.sentence().slice(0, 200),
  language: 'ko',
  thumbnail: 'thumbnail.jpg',
});

/**
 * 검증을 통과하는 DTO 인스턴스를 만든다. `overrides`를 합친 결과가 검증에 실패하면 throw한다.
 *
 * @param dtoClass `CreatePostDto` 또는 `UpdatePostDto`
 * @param overrides 기본값을 덮어쓸 필드
 */
export function createValidDto<T extends CreatePostDto | UpdatePostDto>(
  dtoClass: PostDtoClass & (new () => T),
  overrides: Partial<T> = {},
): T {
  const dto = plainToInstance(dtoClass, {
    ...validPostBody(),
    ...overrides,
  }) as T;
  const errors = validateSync(dto);
  if (errors.length > 0) {
    throw new Error(
      `DTO fixture validation failed: ${errors.map((error) => error.toString()).join(', ')}`,
    );
  }
  return dto;
}
