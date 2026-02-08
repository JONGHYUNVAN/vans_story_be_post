/**
 * 카테고리 생성 DTO
 * 
 * 새로운 카테고리를 생성할 때 사용되는 데이터 전송 객체입니다.
 * 클라이언트로부터 받은 데이터의 유효성을 검증합니다.
 * 
 * @module dto/create-category.dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsMongoId, Min } from 'class-validator';
import { Types } from 'mongoose';

/**
 * 카테고리 생성 DTO
 * 
 * 새로운 카테고리를 생성할 때 필요한 모든 정보를 포함합니다.
 * parentId가 null이면 메인 카테고리, 값이 있으면 서브 카테고리입니다.
 * 
 * @class CreateCategoryDto
 */
export class CreateCategoryDto {
  /**
   * 부모 카테고리 ID (null이면 메인 카테고리)
   */
  @ApiPropertyOptional({
    description: '부모 카테고리 ID (null이면 메인 카테고리)',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  parentId?: Types.ObjectId | null;

  /**
   * 카테고리 그룹 (메인 카테고리에만 적용)
   */
  @ApiPropertyOptional({
    description: '카테고리 그룹 (Frontend, Backend, Database 등, 메인 카테고리에만 필요)',
    example: 'Frontend',
    enum: ['Frontend', 'Backend', 'Database', 'IT', 'Test', 'Etc']
  })
  @IsOptional()
  @IsString()
  group?: string;

  /**
   * 카테고리 값 (URL에 사용되는 키)
   */
  @ApiProperty({
    description: '카테고리 값 (URL 키)',
    example: 'nextjs'
  })
  @IsString()
  value: string;

  /**
   * 카테고리 표시명
   */
  @ApiProperty({
    description: '카테고리 표시명',
    example: 'Next.js'
  })
  @IsString()
  label: string;

  /**
   * 카테고리 설명
   */
  @ApiPropertyOptional({
    description: '카테고리 설명',
    example: 'React 기반 풀스택 프레임워크'
  })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 아이콘 이름 (메인 카테고리에만 적용)
   */
  @ApiPropertyOptional({
    description: '아이콘 이름 (메인 카테고리에만 필요)',
    example: 'SiNextdotjs'
  })
  @IsOptional()
  @IsString()
  iconName?: string;

  /**
   * 아이콘 색상 (메인 카테고리에만 적용)
   */
  @ApiPropertyOptional({
    description: '아이콘 색상 (HEX 코드, 메인 카테고리에만 필요)',
    example: '#000000'
  })
  @IsOptional()
  @IsString()
  color?: string;

  /**
   * 카테고리 경로
   */
  @ApiProperty({
    description: '카테고리 경로',
    example: '/post/view/nextjs'
  })
  @IsString()
  path: string;

  /**
   * 카테고리 활성화 여부
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





