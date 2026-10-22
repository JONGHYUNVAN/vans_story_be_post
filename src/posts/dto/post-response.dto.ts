/**
 * 게시글 응답 DTO
 * 
 * 서버에서 클라이언트로 게시글 정보를 반환할 때 사용되는 데이터 구조를 정의합니다.
 * 게시글의 모든 필드와 메타데이터(생성일, 수정일 등)를 포함합니다.
 */

import { ResponseField } from 'src/common/serialization/response-field.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

/**
 * 게시글 응답 DTO 클래스
 */
export class PostResponseDto {
    @ResponseField
    @ApiProperty({ 
        example: '507f1f77bcf86cd799439011',
        description: 'MongoDB ObjectId'
    })
    _id: Types.ObjectId;

    @ResponseField
    @ApiProperty({ example: '게시글 제목' })
    title: string;

    @ResponseField
    @ApiProperty({ 
        example: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '게시글 내용입니다.' }] }] },
        description: '게시글 내용 (Object)'
    })
    content: Record<string, any>;

    @ResponseField
    @ApiProperty({ example: 'nextjs', description: '메인 카테고리 value (populate된 값)' })
    mainCategory: string;

    @ResponseField
    @ApiProperty({ example: 'Next.js', description: '메인 카테고리 label (표시명)' })
    mainCategoryLabel: string;

    @ResponseField
    @ApiProperty({ example: '507f1f77bcf86cd799439011', description: '메인 카테고리 ID' })
    mainCategoryId: Types.ObjectId;

    @ResponseField
    @ApiProperty({ example: 'introduction', description: '서브 카테고리 value (populate된 값)' })
    subCategory: string;

    @ResponseField
    @ApiProperty({ example: '소개', description: '서브 카테고리 label (표시명)' })
    subCategoryLabel: string;

    @ResponseField
    @ApiProperty({ example: '507f1f77bcf86cd799439012', description: '서브 카테고리 ID' })
    subCategoryId: Types.ObjectId;

    @ResponseField
    @ApiProperty({ example: 'user@example.com' })
    authorEmail: string;

    @ResponseField
    @ApiProperty({ example: '닉네임' })
    author: string;

    @ResponseField
    @ApiProperty({ example: '2025. 3. 24. 오후 9:14:10' })
    createdAt: string;

    @ResponseField
    @ApiProperty({ example: '2025. 4. 27. 오후 7:47:51' })
    updatedAt: string;

    @ResponseField
    @ApiProperty({ example: '게시글 설명입니다.' })
    description: string;

    @ResponseField
    @ApiProperty({ example: ['태그1', '태그2'] })
    tags: string[];

    @ResponseField
    @ApiProperty({ example: 0 })
    viewCount: number;

    @ResponseField
    @ApiProperty({ example: 0 })
    likeCount: number;

    @ResponseField
    @ApiProperty({ example: 'thumbnail.jpg' })
    thumbnail: string;

    @ResponseField
    @ApiProperty({ example: 'ko' })
    language: string;

    @ResponseField
    @ApiProperty({ example: 'Java 알고리즘' })
    topic: string;
}




