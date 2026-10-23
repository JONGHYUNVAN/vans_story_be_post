import { BadRequestException } from '@nestjs/common';
import { ParseObjectIdPipe } from './parse-object-id.pipe';

describe('ParseObjectIdPipe', () => {
  const pipe = new ParseObjectIdPipe();

  it.each(['507f1f77bcf86cd799439011', '507F1F77BCF86CD799439011'])(
    '24자리 16진수 %p는 그대로 돌려준다',
    (id) => {
      expect(pipe.transform(id)).toBe(id);
    },
  );

  it.each([
    ['임의 문자열', 'invalid-id'],
    ['12자 문자열(Types.ObjectId.isValid는 통과)', 'aaaaaaaaaaaa'],
    ['23자리', '507f1f77bcf86cd79943901'],
    ['16진수가 아닌 문자', '507f1f77bcf86cd79943901z'],
    ['빈 문자열', ''],
  ])('%s는 400', (_, id) => {
    expect(() => pipe.transform(id)).toThrow(BadRequestException);
  });

  it('오류 메시지에 입력값을 넣지 않는다', () => {
    expect(() => pipe.transform('<script>')).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining('<script>'),
      }),
    );
  });
});
