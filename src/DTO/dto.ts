/**
 * 게시글 관련 DTO(Data Transfer Object) 정의
 * 
 * 클라이언트와 서버 간 데이터 전송을 위한 객체 형식을 정의합니다.
 * 게시글 생성, 수정, 응답에 사용되는 DTO 클래스를 포함합니다.
 * 
 * @module DTO/dto
 */

import { Field } from '../Mapper/fieldname.extractor';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';

/**
 * 게시글 생성 DTO
 * 
 * 새로운 게시글을 생성할 때 클라이언트에서 서버로 전송되는 데이터 구조를 정의합니다.
 * 제목, 내용, 테마 등 게시글 생성에 필요한 필수 정보를 포함합니다.
 */
export class CreateDto {
    @ApiProperty({
        example: '게시글 제목',
        description: '게시글의 제목'
    })
    title: string;

    @ApiProperty({
        example: '게시글 내용입니다.',
        description: '게시글의 본문 내용'
    })
    content: string;

    @ApiProperty({
        example: 'dark',
        description: '게시글의 테마'
    })
    theme: string;
}

/**
 * 게시글 수정 DTO
 * 
 * 기존 게시글을 수정할 때 클라이언트에서 서버로 전송되는 데이터 구조를 정의합니다.
 * 모든 필드가 선택적(optional)이므로 부분 업데이트가 가능합니다.
 */
export class UpdateDto {
    @ApiPropertyOptional({
        example: '수정된 제목',
        description: '수정할 게시글 제목'
    })
    title?: string;

    @ApiPropertyOptional({
        example: '수정된 내용입니다.',
        description: '수정할 게시글 내용'
    })
    content?: string;

    @ApiPropertyOptional({
        example: 'light',
        description: '수정할 테마'
    })
    theme?: string;
}

/**
 * 게시글 응답 DTO
 * 
 * 서버에서 클라이언트로 게시글 정보를 반환할 때 사용되는 데이터 구조를 정의합니다.
 * 게시글의 모든 필드와 메타데이터(생성일, 수정일 등)를 포함합니다.
 */
export class ResponseDto {
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
    @ApiProperty({ example: '게시글 내용입니다.' })
    content: string;

    @Field
    @ApiProperty({ example: 'dark' })
    theme: string;

    @Field
    @ApiProperty({ example: 'user@example.com' })
    authorEmail: string;

    @Field
    @ApiProperty({ example: '닉네임' })
    author: string;

    @Field
    @ApiProperty({ example: '2024-03-19T09:00:00.000Z' })
    createdAt: Date;

    @Field
    @ApiProperty({ example: '2024-03-19T09:00:00.000Z' })
    updatedAt: Date;
}