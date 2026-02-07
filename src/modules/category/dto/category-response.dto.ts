/**
 * 카테고리 응답 DTO
 * 
 * 클라이언트에게 카테고리 데이터를 반환할 때 사용되는 데이터 전송 객체입니다.
 * API 응답의 일관성을 보장하고 불필요한 내부 데이터를 제외합니다.
 * 
 * @module dto/category-response.dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 서브 카테고리 응답 DTO
 * 
 * @class SubCategoryResponseDto
 * @property {string} value - 서브 카테고리 값
 * @property {string} label - 서브 카테고리 표시명
 * @property {string} [description] - 서브 카테고리 설명
 */
export class SubCategoryResponseDto {
  /**
   * 서브 카테고리 값 (URL 키)
   * 
   * @type {string}
   * @example "introduction"
   */
  @ApiProperty({
    description: '서브 카테고리 값 (URL 키)',
    example: 'introduction'
  })
  value: string;

  /**
   * 서브 카테고리 표시명
   * 
   * @type {string}
   * @example "소개"
   */
  @ApiProperty({
    description: '서브 카테고리 표시명',
    example: '소개'
  })
  label: string;

  /**
   * 서브 카테고리 설명
   * 
   * @type {string}
   * @example "Next.js 프레임워크 소개"
   */
  @ApiPropertyOptional({
    description: '서브 카테고리 설명',
    example: 'Next.js 프레임워크 소개'
  })
  description?: string;
}

/**
 * 카테고리 응답 DTO
 * 
 * 클라이언트에게 반환되는 카테고리 정보를 정의합니다.
 * 
 * @class CategoryResponseDto
 * @property {string} id - 카테고리 ID
 * @property {string} group - 카테고리 그룹
 * @property {string} value - 카테고리 값
 * @property {string} label - 카테고리 표시명
 * @property {string} [description] - 카테고리 설명
 * @property {string} iconName - 아이콘 이름
 * @property {string} color - 아이콘 색상
 * @property {string} path - 카테고리 경로
 * @property {SubCategoryResponseDto[]} subCategories - 서브 카테고리 목록
 * @property {boolean} isActive - 활성화 여부
 * @property {number} sortOrder - 정렬 순서
 * @property {Date} createdAt - 생성일시
 * @property {Date} updatedAt - 수정일시
 */
export class CategoryResponseDto {
  /**
   * 카테고리 ID
   * 
   * @type {string}
   * @example "507f1f77bcf86cd799439011"
   */
  @ApiProperty({
    description: '카테고리 ID',
    example: '507f1f77bcf86cd799439011'
  })
  id: string;

  /**
   * 카테고리 그룹
   * 
   * @type {string}
   * @example "Frontend"
   */
  @ApiProperty({
    description: '카테고리 그룹',
    example: 'Frontend'
  })
  group: string;

  /**
   * 카테고리 값 (URL 키)
   * 
   * @type {string}
   * @example "nextjs"
   */
  @ApiProperty({
    description: '카테고리 값 (URL 키)',
    example: 'nextjs'
  })
  value: string;

  /**
   * 카테고리 표시명
   * 
   * @type {string}
   * @example "Next.js"
   */
  @ApiProperty({
    description: '카테고리 표시명',
    example: 'Next.js'
  })
  label: string;

  /**
   * 카테고리 설명
   * 
   * @type {string}
   * @example "React 기반 풀스택 프레임워크"
   */
  @ApiPropertyOptional({
    description: '카테고리 설명',
    example: 'React 기반 풀스택 프레임워크'
  })
  description?: string;

  /**
   * 아이콘 이름
   * 
   * @type {string}
   * @example "SiNextdotjs"
   */
  @ApiProperty({
    description: '아이콘 이름',
    example: 'SiNextdotjs'
  })
  iconName: string;

  /**
   * 아이콘 색상 (HEX 코드)
   * 
   * @type {string}
   * @example "#000000"
   */
  @ApiProperty({
    description: '아이콘 색상 (HEX 코드)',
    example: '#000000'
  })
  color: string;

  /**
   * 카테고리 경로
   * 
   * @type {string}
   * @example "/post/view/nextjs"
   */
  @ApiProperty({
    description: '카테고리 경로',
    example: '/post/view/nextjs'
  })
  path: string;

  /**
   * 서브 카테고리 목록
   * 
   * @type {SubCategoryResponseDto[]}
   */
  @ApiProperty({
    description: '서브 카테고리 목록',
    type: [SubCategoryResponseDto]
  })
  subCategories: SubCategoryResponseDto[];

  /**
   * 카테고리 활성화 여부
   * 
   * @type {boolean}
   * @example true
   */
  @ApiProperty({
    description: '카테고리 활성화 여부',
    example: true
  })
  isActive: boolean;

  /**
   * 카테고리 정렬 순서
   * 
   * @type {number}
   * @example 1
   */
  @ApiProperty({
    description: '카테고리 정렬 순서',
    example: 1
  })
  sortOrder: number;

  /**
   * 생성일시
   * 
   * @type {Date}
   * @example "2024-01-01T00:00:00.000Z"
   */
  @ApiProperty({
    description: '생성일시',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  /**
   * 수정일시
   * 
   * @type {Date}
   * @example "2024-01-01T00:00:00.000Z"
   */
  @ApiProperty({
    description: '수정일시',
    example: '2024-01-01T00:00:00.000Z'
  })
  updatedAt: Date;
}




