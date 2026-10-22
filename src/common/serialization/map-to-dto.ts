import { RESPONSE_FIELDS_KEY } from './response-field.decorator';

/**
 * 엔티티에서 `@ResponseField`가 붙은 속성만 골라 DTO 인스턴스로 복사합니다.
 *
 * `Date` 값은 서버 locale의 `toLocaleString()` 문자열이 된다(`TODO.md` 2절 결정 5).
 *
 * @template TEntity - 원본 엔티티 타입
 * @template TDto - 대상 DTO 타입
 * @param {TEntity} entity - 변환할 엔티티 객체
 * @param {new () => TDto} dtoClass - 대상 DTO 클래스 생성자
 * @returns {TDto} 변환된 DTO 객체
 *
 * @example
 * ```typescript
 * const postResponse = mapToDto(post, PostResponseDto);
 * ```
 */
export function mapToDto<TEntity, TDto>(entity: TEntity, dtoClass: new () => TDto): TDto {
  const dto = new dtoClass();
  const fields: string[] = Reflect.getMetadata(RESPONSE_FIELDS_KEY, dtoClass.prototype) || [];

  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(entity, field)) {
      const fieldValue = (entity as any)[field];
      if (fieldValue instanceof Date) {
        (dto as any)[field] = fieldValue.toLocaleString();
      }
      else {
        (dto as any)[field] = fieldValue;
      }
    }
  });

  return dto;
}
