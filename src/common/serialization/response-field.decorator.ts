/**
 * 필드 메타데이터 추출기
 * 
 * 클래스 속성에 메타데이터를 추가하기 위한 데코레이터를 제공합니다.
 * 리플렉션 메타데이터를 사용하여 DTO 클래스의 필드를 추적합니다.
 * 
 * @module Mapper/fieldname.extractor
 */

import 'reflect-metadata';

/**
 * Field 데코레이터
 * 
 * 클래스 속성에 적용되어 해당 속성이 DTO 매핑 대상임을 표시합니다.
 * 'fields' 메타데이터 배열에 속성 이름을 추가합니다.
 * 
 * @param {Object} target - 데코레이터가 적용된 객체
 * @param {string} key - 데코레이터가 적용된 속성 이름
 * 
 * @example
 * ```typescript
 * class SomeDto {
 *   @Field
 *   id: string;
 * 
 *   @Field
 *   name: string;
 * }
 * ```
 */
export function Field(target: any, key: string) {
  const fields = Reflect.getMetadata('fields', target) || [];

  fields.push(key);

  Reflect.defineMetadata('fields', fields, target);
}