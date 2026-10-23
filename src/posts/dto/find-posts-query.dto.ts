import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DEFAULT_POSTS_PER_PAGE, MAX_POSTS_PER_PAGE } from '../posts.constants';

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
    default: DEFAULT_POSTS_PER_PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_POSTS_PER_PAGE)
  limit?: number = DEFAULT_POSTS_PER_PAGE;
}
