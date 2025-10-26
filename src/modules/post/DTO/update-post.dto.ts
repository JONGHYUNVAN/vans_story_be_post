/**
 * 게시글 수정 DTO
 * 
 * 기존 게시글을 수정할 때 클라이언트에서 서버로 전송되는 데이터 구조를 정의합니다.
 * 모든 필드가 선택적(optional)이며, 제공된 필드만 업데이트됩니다.
 * 
 * @module dto/update-post.dto
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, MinLength, MaxLength, IsObject } from 'class-validator';

/**
 * 게시글 수정 DTO 클래스
 */
export class UpdatePostDto {
    @ApiPropertyOptional({
        example: '수정된 제목',
        description: '수정할 게시글 제목'
    })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    title?: string;

    @ApiPropertyOptional({
        example: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '수정된 내용입니다.' }] }] },
        description: '수정할 게시글 내용 (Object)'
    })
    @IsOptional()
    @IsObject()
    content?: Record<string, any>;

    @ApiPropertyOptional({
        example: 'light',
        description: '수정할 메인 카테고리 (기존 테마)'
    })
    @IsOptional()
    @IsString()
    mainCategory?: string;

    @ApiPropertyOptional({
        example: '수정된 설명입니다.',
        description: '수정할 게시글 설명'
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({
        example: ['태그1', '태그2'],
        description: '수정할 태그 목록'
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiPropertyOptional({
        example: 'introduction',
        description: '수정할 서브 카테고리 (기존 카테고리)'
    })
    @IsOptional()
    @IsString()
    subCategory?: string;

    @ApiPropertyOptional({
        example: 'Java 알고리즘',
        description: '수정할 주제'
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    topic?: string;

    @ApiPropertyOptional({
        example: 'thumbnail.jpg',
        description: '수정할 썸네일 이미지'
    })
    @IsOptional()
    @IsString()
    thumbnail?: string;

    @ApiPropertyOptional({
        example: 'ko',
        description: '수정할 언어'
    })
    @IsOptional()
    @IsString()
    language?: string;
}
