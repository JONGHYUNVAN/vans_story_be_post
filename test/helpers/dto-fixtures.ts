import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { faker } from '@faker-js/faker/locale/ko';
import { CreatePostDto, UpdatePostDto, PostResponseDto } from 'src/posts/dto';
import {
  MAIN_CATEGORY_ID,
  POST_ID,
  SUB_CATEGORY_ID,
  populatedMainCategory,
  populatedSubCategory,
} from './post-fixtures';

export class MockGenerator {
  /**
   * DTO 클래스로부터 Mock 데이터를 생성합니다.
   * @param dtoClass DTO 클래스
   * @param overrides 기본값을 덮어쓸 데이터
   * @returns Mock 데이터
   */
  static createMock<T extends object>(dtoClass: new () => T, overrides: Partial<T> = {}): T {
    const mockData = this.generateMockData(new dtoClass());
    const mergedData = { ...mockData, ...overrides };
    const instance = plainToInstance(dtoClass, mergedData);
    
    const errors = validateSync(instance);
    if (errors.length > 0) {
      throw new Error(`Mock data validation failed: ${errors.map(e => e.toString()).join(', ')}`);
    }

    return instance;
  }

  /**
   * DTO 클래스의 프로퍼티 타입에 따라 Mock 데이터를 생성합니다.
   * @param dtoClass DTO 클래스
   * @returns Mock 데이터
   */
  private static generateMockData<T extends object>(dto: T): T {
    const mockData: any = {};
    
    // ResponseDto인 경우 특별한 처리
    if (dto instanceof PostResponseDto) {
      return {
        _id: POST_ID,
        title: faker.lorem.sentence().slice(0, 100),
        content: {
          type: 'doc',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: faker.lorem.paragraphs()
            }]
          }]
        },
        mainCategoryId: MAIN_CATEGORY_ID,
        mainCategory: populatedMainCategory.value,
        mainCategoryLabel: populatedMainCategory.label,
        subCategoryId: SUB_CATEGORY_ID,
        subCategory: populatedSubCategory.value,
        subCategoryLabel: populatedSubCategory.label,
        description: faker.lorem.paragraph().slice(0, 500),
        tags: [faker.lorem.word(), faker.lorem.word()],
        topic: faker.lorem.sentence().slice(0, 200),
        language: 'ko',
        thumbnail: 'thumbnail.jpg',
        authorEmail: 'test@example.com',
        author: '테스트 작성자',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 0,
        likeCount: 0
      } as T;
    }
    
    // CreateDto인 경우 특별한 처리 (mainCategoryId / subCategoryId 는 @IsMongoId 검증을 통과해야 한다)
    if (dto instanceof CreatePostDto) {
      return {
        title: faker.lorem.sentence().slice(0, 100),
        content: {
          type: 'doc',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: faker.lorem.paragraphs()
            }]
          }]
        },
        mainCategoryId: MAIN_CATEGORY_ID.toHexString(),
        subCategoryId: SUB_CATEGORY_ID.toHexString(),
        description: faker.lorem.paragraph().slice(0, 500),
        tags: [faker.lorem.word(), faker.lorem.word()],
        topic: faker.lorem.sentence().slice(0, 200),
        language: 'ko',
        thumbnail: 'thumbnail.jpg'
      } as T;
    }

    // UpdateDto인 경우 특별한 처리
    if (dto instanceof UpdatePostDto) {
      return {
        title: faker.lorem.sentence().slice(0, 100),
        content: {
          type: 'doc',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: faker.lorem.paragraphs()
            }]
          }]
        },
        mainCategoryId: MAIN_CATEGORY_ID.toHexString(),
        subCategoryId: SUB_CATEGORY_ID.toHexString(),
        description: faker.lorem.paragraph().slice(0, 500),
        tags: [faker.lorem.word(), faker.lorem.word()],
        topic: faker.lorem.sentence().slice(0, 200),
        thumbnail: faker.image.url(),
        language: 'ko'
      } as T;
    }

    // 일반적인 경우
    for (const key in dto) {
      if (dto.hasOwnProperty(key)) {
        mockData[key] = this.generateValueByType(typeof dto[key], key);
      }
    }

    return mockData;
  }

  /**
   * 값의 타입에 따라 적절한 Mock 데이터를 생성합니다.
   * @param type 값의 타입
   * @returns Mock 데이터
   */
  private static generateValueByType(type: string, key: string): any {
    switch (type) {
      case 'string':
        switch (key) {
          case 'title':
            return faker.lorem.sentence().slice(0, 100);
          case 'content':
            return {
              type: 'doc',
              content: [{
                type: 'paragraph',
                content: [{
                  type: 'text',
                  text: faker.lorem.paragraphs()
                }]
              }]
            };
          case 'mainCategoryId':
            return MAIN_CATEGORY_ID.toHexString();
          case 'subCategoryId':
            return SUB_CATEGORY_ID.toHexString();
          case 'mainCategory':
            return populatedMainCategory.value;
          case 'subCategory':
            return populatedSubCategory.value;
          case 'description':
            return faker.lorem.paragraph().slice(0, 500);
          case 'topic':
            return faker.lorem.sentence().slice(0, 200);
          case 'language':
            return 'ko';
          case 'thumbnail':
            return 'thumbnail.jpg';
          default:
            return faker.lorem.word();
        }
      case 'number':
        return faker.number.int({ min: 1, max: 100 });
      case 'boolean':
        return faker.datatype.boolean();
      case 'object':
        if (key === 'tags') {
          return [faker.lorem.word(), faker.lorem.word()];
        }
        return {};
      default:
        return null;
    }
  }
} 
