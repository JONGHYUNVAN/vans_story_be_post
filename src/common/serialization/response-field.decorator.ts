import 'reflect-metadata';

/** `@ResponseField`가 붙은 속성 이름 목록을 담는 메타데이터 키 */
export const RESPONSE_FIELDS_KEY = 'fields';

/**
 * 응답 DTO에서 `mapToDto`가 엔티티 값을 복사할 속성을 표시합니다.
 *
 * @example
 * ```typescript
 * class PostResponseDto {
 *   @ResponseField
 *   title: string;
 * }
 * ```
 */
export function ResponseField(target: object, key: string) {
  const fields: string[] =
    Reflect.getMetadata(RESPONSE_FIELDS_KEY, target) || [];

  fields.push(key);

  Reflect.defineMetadata(RESPONSE_FIELDS_KEY, fields, target);
}
