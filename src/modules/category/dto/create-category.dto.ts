/**
 * 카테고리 생성 DTO
 * 
 * 새로운 카테고리를 생성할 때 사용되는 데이터 전송 객체입니다.
 * 클라이언트로부터 받은 데이터의 유효성을 검증합니다.
 * 
 * @module dto/create-category.dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 서브 카테고리 생성 DTO
 * 
 * @class CreateSubCategoryDto
 * @property {string} value - 서브 카테고리 값 (URL 키)
 * @property {string} label - 서브 카테고리 표시명
 * @property {string} [description] - 서브 카테고리 설명 (선택사항)
 */
export class CreateSubCategoryDto {
  /**
   * 서브 카테고리 값 (URL에 사용되는 키)
   * 
   * @type {string}
   * @example "introduction"
   */
  @ApiProperty({
    description: '서브 카테고리 값 (URL 키)',
    example: 'introduction'
  })
  @IsString()
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
  @IsString()
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
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * 카테고리 생성 DTO
 * 
 * 새로운 카테고리를 생성할 때 필요한 모든 정보를 포함합니다.
 * 
 * @class CreateCategoryDto
 * @property {string} group - 카테고리 그룹
 * @property {string} value - 카테고리 값 (URL 키)
 * @property {string} label - 카테고리 표시명
 * @property {string} [description] - 카테고리 설명
 * @property {string} iconName - 아이콘 이름
 * @property {string} color - 아이콘 색상
 * @property {string} path - 카테고리 경로
 * @property {CreateSubCategoryDto[]} [subCategories] - 서브 카테고리 목록
 * @property {boolean} [isActive] - 활성화 여부
 * @property {number} [sortOrder] - 정렬 순서
 */
export class CreateCategoryDto {
  /**
   * 카테고리 그룹 (Frontend, Backend, Database, IT, Test, Etc)
   * 
   * @type {string}
   * @example "Frontend"
   */
  @ApiProperty({
    description: '카테고리 그룹',
    example: 'Frontend',
    enum: ['Frontend', 'Backend', 'Database', 'IT', 'Test', 'Etc']
  })
  @IsString()
  group: string;

  /**
   * 카테고리 값 (URL에 사용되는 키)
   * 
   * @type {string}
   * @example "nextjs"
   */
  @ApiProperty({
    description: '카테고리 값 (URL 키)',
    example: 'nextjs'
  })
  @IsString()
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
  @IsString()
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
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 아이콘 이름 (React Icons 라이브러리 기준)
   * 
   * @type {string}
   * @example "SiNextdotjs"
   */
  @ApiProperty({
    description: '아이콘 이름',
    example: 'SiNextdotjs'
  })
  @IsString()
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
  @IsString()
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
  @IsString()
  path: string;

  /**
   * 서브 카테고리 목록
   * 
   * @type {CreateSubCategoryDto[]}
   */
  @ApiPropertyOptional({
    description: '서브 카테고리 목록',
    type: [CreateSubCategoryDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubCategoryDto)
  subCategories?: CreateSubCategoryDto[];

  /**
   * 카테고리 활성화 여부
   * 
   * @type {boolean}
   * @example true
   */
  @ApiPropertyOptional({
    description: '카테고리 활성화 여부',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /**
   * 카테고리 정렬 순서
   * 
   * @type {number}
   * @example 1
   */
  @ApiPropertyOptional({
    description: '카테고리 정렬 순서',
    example: 1,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}




