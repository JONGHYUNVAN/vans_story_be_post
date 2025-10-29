/**
 * 게시글 응답 DTO
 * 
 * 서버에서 클라이언트로 게시글 정보를 반환할 때 사용되는 데이터 구조를 정의합니다.
 * 게시글의 모든 필드와 메타데이터(생성일, 수정일 등)를 포함합니다.
 * 
 * @module dto/post-response.dto
 */

import { Field } from '../../../utils/Mapper/fieldname.extractor';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

/**
 * 게시글 응답 DTO 클래스
 */
export class PostResponseDto {
    @Field
    @ApiProperty({ 
        example: '507f1f77bcf86cd799439011',
        description: 'MongoDB ObjectId'
    })
    _id: Types.ObjectId;

    @Field
    @ApiProperty({ example: '게시글 제목' })
    title: string;

    @Field
    @ApiProperty({ 
        example: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '게시글 내용입니다.' }] }] },
        description: '게시글 내용 (Object)'
    })
    content: Record<string, any>;

    @Field
    @ApiProperty({ example: 'nestjs' })
    mainCategory: string;

    @Field
    @ApiProperty({ example: 'user@example.com' })
    authorEmail: string;

    @Field
    @ApiProperty({ example: '닉네임' })
    author: string;

    @Field
    @ApiProperty({ example: '2025. 3. 24. 오후 9:14:10' })
    createdAt: string;

    @Field
    @ApiProperty({ example: '2025. 4. 27. 오후 7:47:51' })
    updatedAt: string;

    @Field
    @ApiProperty({ example: '게시글 설명입니다.' })
    description: string;

    @Field
    @ApiProperty({ example: ['태그1', '태그2'] })
    tags: string[];

    @Field
    @ApiProperty({ example: 0 })
    viewCount: number;

    @Field
    @ApiProperty({ example: 0 })
    likeCount: number;

    @Field
    @ApiProperty({ example: 'introduction' })
    subCategory: string;

    @Field
    @ApiProperty({ example: 'thumbnail.jpg' })
    thumbnail: string;

    @Field
    @ApiProperty({ example: 'ko' })
    language: string;

    @Field
    @ApiProperty({ example: 'Java 알고리즘' })
    topic: string;
}


