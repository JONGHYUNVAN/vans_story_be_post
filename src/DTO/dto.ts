import { Field } from '../Mapper/fieldname.extractor';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class ResponseDto {
    @Field
    @ApiProperty({ example: 1 })
    id: number;

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
    @ApiProperty({ example: '2024-03-19T09:00:00.000Z' })
    createdAt: Date;

    @Field
    @ApiProperty({ example: '2024-03-19T09:00:00.000Z' })
    updatedAt: Date;
}