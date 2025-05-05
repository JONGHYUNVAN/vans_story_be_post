import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { faker } from '@faker-js/faker/locale/ko';
import { CreateDto, UpdateDto } from '../../src/modules/post/DTO/dto';

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
    
    // CreateDto인 경우 특별한 처리
    if (dto instanceof CreateDto) {
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
        theme: 'light',
        description: faker.lorem.paragraph().slice(0, 500),
        tags: [faker.lorem.word(), faker.lorem.word()],
        category: 'introduction',
        topic: faker.lorem.sentence().slice(0, 200)
      } as T;
    }

    // UpdateDto인 경우 특별한 처리
    if (dto instanceof UpdateDto) {
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
        theme: 'light',
        description: faker.lorem.paragraph().slice(0, 500),
        tags: [faker.lorem.word(), faker.lorem.word()],
        category: 'introduction',
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
          case 'theme':
            return 'light';
          case 'description':
            return faker.lorem.paragraph().slice(0, 500);
          case 'category':
            return 'introduction';
          case 'topic':
            return faker.lorem.sentence().slice(0, 200);
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