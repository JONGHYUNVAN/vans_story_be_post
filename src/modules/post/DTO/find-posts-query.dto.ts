import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** 목록 한 페이지의 최대 게시글 수. 게시글마다 사용자 서비스를 호출하므로 크게 열지 않는다 */
export const MAX_POSTS_PER_PAGE = 50;

/**
 * 게시글 목록 조회 쿼리
 *
 * 형식이 틀리거나 범위를 벗어나면 전역 `ValidationPipe`가 400으로 거부한다.
 */
export class FindPostsQueryDto {
  @ApiPropertyOptional({
    description: '필터링할 메인 카테고리 value',
    example: 'light',
  })
  @IsOptional()
  @IsString()
  mainCategory?: string;

  @ApiPropertyOptional({
    description: '필터링할 서브 카테고리 value',
    example: 'introduction',
  })
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiPropertyOptional({ description: '페이지 번호', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 게시글 수',
    minimum: 1,
    maximum: MAX_POSTS_PER_PAGE,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_POSTS_PER_PAGE)
  limit?: number = 10;
}
