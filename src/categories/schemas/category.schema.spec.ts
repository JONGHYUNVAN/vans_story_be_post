import { Types } from 'mongoose';
import { CategorySchema } from './category.schema';

describe('CategorySchema', () => {
  it('parentId 경로는 ObjectId 타입이다', () => {
    expect(CategorySchema.path('parentId').instance).toBe('ObjectId');
  });

  it('parentId 문자열은 ObjectId로 캐스팅된다', () => {
    const hex = '69881878744da6629fa629b5';
    const path = CategorySchema.path('parentId') as unknown as {
      cast(value: unknown): unknown;
    };
    const casted = path.cast(hex);
    expect(casted).toBeInstanceOf(Types.ObjectId);
    expect(String(casted)).toBe(hex);
  });
});
