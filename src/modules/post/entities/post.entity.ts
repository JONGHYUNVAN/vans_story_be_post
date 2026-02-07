/**
 * Post 엔티티 정의
 * 
 * MongoDB에 저장되는 게시글 데이터의 구조를 정의합니다.
 * 
 * @module entities/post.entity
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 게시글 문서 타입
 */
export type PostDocument = Post & Document;

/**
 * 게시글 엔티티 클래스
 */
@Schema({
  timestamps: true,
  collection: 'posts'
})
export class Post {
  /**
   * 게시글 제목
   */
  @Prop({ required: true })
  title: string;

  /**
   * 게시글 주제
   */
  @Prop({ required: true })
  topic: string;

  /**
   * 게시글 설명
   */
  @Prop({ required: true })
  description: string;

  /**
   * 작성자 이메일
   */
  @Prop({ required: true })
  authorEmail: string;

  /**
   * 게시글 내용
   */
  @Prop({ type: Object, required: true })
  content: Record<string, any>;

  /**
   * 게시글 태그 목록
   */
  @Prop({ type: [String], default: [] })
  tags: string[];

  /**
   * 조회수
   */
  @Prop({ default: 0 })
  viewCount: number;

  /**
   * 좋아요 수
   */
  @Prop({ default: 0 })
  likeCount: number;

  /**
   * 메인 카테고리 (기존 테마)
   */
  @Prop({ required: true })
  mainCategory: string;

  /**
   * 서브 카테고리 (기존 카테고리)
   */
  @Prop({ required: true })
  subCategory: string;

  /**
   * 썸네일 이미지 URL
   */
  @Prop({ required: false })
  thumbnail?: string;

  /**
   * 게시글 언어
   */
  @Prop({ required: true, default: 'ko' })
  language: string;
}

/**
 * Post 클래스에서 생성된 Mongoose 스키마
 */
export const PostSchema = SchemaFactory.createForClass(Post);




