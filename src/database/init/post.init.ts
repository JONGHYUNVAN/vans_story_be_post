/**
 * 게시글 초기화 모듈
 * 
 * 애플리케이션 시작 시 기본 게시글 데이터를 생성합니다.
 * 
 * @module database/init/post.init
 */

import { Model } from 'mongoose';
import { Post } from '../../modules/post/schemas/post.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, OnModuleInit } from '@nestjs/common';

/**
 * 게시글 초기 데이터
 * @description 애플리케이션 시작 시 기본적으로 생성될 초기 게시글입니다.
 * @warning 현재는 mainCategoryId (ObjectId)를 사용하므로, Category가 먼저 생성되어야 합니다.
 */
const initialPosts: any[] = [
  // 주석: 마이그레이션 후에는 mainCategoryId (ObjectId)가 필요합니다
  // {
  //   title: "샘플 게시글",
  //   mainCategoryId: "ObjectId를 여기에 입력", // Category 컬렉션의 _id
  //   topic: "테스트 토픽",
  //   description: "테스트 설명",
  //   content: `<h1>Hello World</h1>...`,
  //   authorEmail: "test@vans-story.com",
  //   subCategoryValue: "nextjs",
  //   tags: ["테스트", "태그"],
  //   thumbnail: "",
  //   language: "ko"
  // }
];

/**
 * 게시글 초기화 서비스
 * 
 * 애플리케이션 시작 시 기본 게시글 데이터를 MongoDB에 생성합니다.
 * NestJS의 OnModuleInit 인터페이스를 구현하여 모듈 초기화 시 자동 실행됩니다.
 */
@Injectable()
export class PostInitService implements OnModuleInit {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>
  ) {}

  /**
   * 모듈 초기화 시 실행되는 메서드
   * 
   * 기존 데이터 유무를 확인하고 없을 경우에만 초기 데이터를 삽입합니다.
   * @note 현재는 초기 데이터가 비활성화되어 있습니다 (mainCategoryId 필요)
   */
  async onModuleInit() {
    try {
      // 초기 데이터가 비어있는 경우 스킵
      if (initialPosts.length === 0) {
        console.log('ℹ️  초기 게시글 데이터가 설정되지 않았습니다.');
        return;
      }

      // 기존 데이터 확인
      const firstPost = initialPosts[0];
      if (!firstPost || !firstPost.title) {
        console.log('ℹ️  초기 게시글 데이터 형식이 올바르지 않습니다.');
        return;
      }

      const existingPost = await this.postModel.findOne({ title: firstPost.title });

      // 중복 데이터가 없는 경우에만 삽입
      if (!existingPost) {
        await this.postModel.create(initialPosts);
        console.log('✅ 초기 게시글이 성공적으로 생성되었습니다.');
      } else {
        console.log('ℹ️  초기 게시글이 이미 존재합니다.');
      }
    } catch (error) {
      console.error('❌ 초기 게시글 생성 중 오류 발생:', error);
    }
  }
} 