/**
 * 엔티티-DTO 매핑 모듈
 * 
 * 데이터베이스 엔티티를 DTO로 변환하는 유틸리티 함수를 제공합니다.
 * 
 * @module Mapper/mapper
 */

/**
 * 엔티티 객체를 DTO 객체로 변환합니다.
 * 
 * @template Entity - 변환할 원본 엔티티 타입
 * @template Dto - 변환 대상 DTO 타입
 * @param {Entity} entity - 변환할 엔티티 객체
 * @param {new () => Dto} dtoClass - 대상 DTO 클래스 생성자
 * @returns {Dto} 변환된 DTO 객체
 * 
 * @example
 * ```typescript
 * const postDto = mapToDto(postEntity, ResponseDto);
 * ```
 */
export function mapToDto<Entity, Dto>(entity: Entity, dtoClass: new () => Dto): Dto {
  const dto = new dtoClass();
  const fields: string[] = Reflect.getMetadata('fields', dtoClass.prototype) || [];

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