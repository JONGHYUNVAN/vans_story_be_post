/**
 * 게시글 생성 DTO
 * 
 * 새로운 게시글을 생성할 때 클라이언트에서 서버로 전송되는 데이터 구조를 정의합니다.
 * 제목, 내용, 메인 카테고리 등 게시글 생성에 필요한 필수 정보를 포함합니다.
 * 
 * @module dto/create-post.dto
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, MinLength, MaxLength, IsObject, IsMongoId } from 'class-validator';

/**
 * 게시글 생성 DTO 클래스
 */
export class CreatePostDto {
    @ApiProperty({
        example: '게시글 제목',
        description: '게시글의 제목'
    })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    title: string;

    @ApiProperty({
        example: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '게시글 내용입니다.' }] }] },
        description: '게시글의 본문 내용 (Object)'
    })
    @IsObject()
    content: Record<string, any>;

    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: '메인 카테고리 ID (Category ObjectId)'
    })
    @IsMongoId()
    mainCategoryId: string;

    @ApiProperty({
        example: '507f1f77bcf86cd799439012',
        description: '서브 카테고리 ID (Category의 subCategories._id)'
    })
    @IsMongoId()
    subCategoryId: string;

    @ApiProperty({
        example: '게시글 설명입니다.',
        description: '게시글의 설명'
    })
    @IsString()
    @MaxLength(500)
    description: string;

    @ApiProperty({
        example: ['태그1', '태그2'],
        description: '게시글의 태그 목록'
    })
    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @ApiProperty({
        example: 'Java 알고리즘',
        description: '게시글의 주제'
    })
    @IsString()
    @MaxLength(200)
    topic: string;

    @ApiProperty({
        example: 'thumbnail.jpg',
        description: '썸네일 이미지'
    })
    @IsOptional()
    @IsString()
    thumbnail?: string;

    @ApiProperty({
        example: 'ko',
        description: '게시글 언어'
    })
    @IsString()
    language: string;
}




