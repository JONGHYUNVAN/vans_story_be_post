import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const OBJECT_ID = /^[0-9a-f]{24}$/i;

/**
 * 경로 파라미터가 MongoDB ObjectId(24자리 16진수)인지 검사한다.
 *
 * 형식이 틀리면 400. 통과한 값은 문자열 그대로 돌려준다.
 * `@nestjs/mongoose`의 `ParseObjectIdPipe`를 쓰지 않는 이유: 오류 메시지에 입력값을 그대로 넣고,
 * `Types.ObjectId.isValid`라 아무 12자 문자열도 통과시킨다(DTO의 `@IsMongoId()`와 기준이 다름).
 *
 * @example
 * ```typescript
 * @Get(':id')
 * findOne(@Param('id', ParseObjectIdPipe) id: string) {}
 * ```
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string' || !OBJECT_ID.test(value)) {
      throw new BadRequestException('id는 24자리 16진수 ObjectId여야 합니다.');
    }
    return value;
  }
}
