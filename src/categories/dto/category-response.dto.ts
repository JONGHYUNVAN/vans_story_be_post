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
 * 카테고리 응답 DTO
 * 
 * 클라이언트에게 반환되는 카테고리 정보를 정의합니다.
 * parentId가 null이면 메인 카테고리, 값이 있으면 서브 카테고리입니다.
 * 
 * @class CategoryResponseDto
 */
export class CategoryResponseDto {
  /**
   * 카테고리 ID
   */
  @ApiProperty({
    description: '카테고리 ID',
    example: '507f1f77bcf86cd799439011'
  })
  id: string;

  /**
   * 부모 카테고리 ID (null이면 메인 카테고리)
   */
  @ApiPropertyOptional({
    description: '부모 카테고리 ID (null이면 메인 카테고리)',
    example: '507f1f77bcf86cd799439011'
  })
  parentId?: string | null;

  /**
   * 카테고리 그룹 (메인 카테고리에만 적용)
   */
  @ApiPropertyOptional({
    description: '카테고리 그룹 (Frontend, Backend, Database 등)',
    example: 'Frontend'
  })
  group?: string;

  /**
   * 카테고리 값 (URL 키)
   */
  @ApiProperty({
    description: '카테고리 값 (URL 키)',
    example: 'nextjs'
  })
  value: string;

  /**
   * 카테고리 표시명
   */
  @ApiProperty({
    description: '카테고리 표시명',
    example: 'Next.js'
  })
  label: string;

  /**
   * 카테고리 설명
   */
  @ApiPropertyOptional({
    description: '카테고리 설명',
    example: 'React 기반 풀스택 프레임워크'
  })
  description?: string;

  /**
   * 아이콘 이름 (메인 카테고리에만 적용)
   */
  @ApiPropertyOptional({
    description: '아이콘 이름',
    example: 'SiNextdotjs'
  })
  iconName?: string;

  /**
   * 아이콘 색상 (메인 카테고리에만 적용)
   */
  @ApiPropertyOptional({
    description: '아이콘 색상 (HEX 코드)',
    example: '#000000'
  })
  color?: string;

  /**
   * 카테고리 경로
   */
  @ApiProperty({
    description: '카테고리 경로',
    example: '/post/view/nextjs'
  })
  path: string;

  /**
   * 카테고리 활성화 여부
   */
  @ApiProperty({
    description: '카테고리 활성화 여부',
    example: true
  })
  isActive: boolean;

  /**
   * 카테고리 정렬 순서
   */
  @ApiProperty({
    description: '카테고리 정렬 순서',
    example: 1
  })
  sortOrder: number;

  /**
   * 생성일시
   */
  @ApiProperty({
    description: '생성일시',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  /**
   * 수정일시
   */
  @ApiProperty({
    description: '수정일시',
    example: '2024-01-01T00:00:00.000Z'
  })
  updatedAt: Date;
}





