/**
 * 게시글 초기화 모듈
 * 
 * 애플리케이션 시작 시 기본 게시글 데이터를 생성합니다.
 * 
 * @module database/init/post.init
 */

import { Model } from 'mongoose';
import { Post } from '../../schemas/post.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, OnModuleInit } from '@nestjs/common';

/**
 * 게시글 초기 데이터
 * @description 애플리케이션 시작 시 기본적으로 생성될 초기 게시글입니다.
 */
const initialPosts = [
  {
    title: "샘플 게시글",
    theme: "next",
    topic: "테스트 토픽",
    description: "테스트 설명",
    content: `<h1>Hello World</h1>
            <p>This is a sample post</p>
            <pre><code class='language-typescript'>const hello = 'world';</code></pre>
            <ul>
            <li>항목 1</li>
            <li>항목 2</li>
            </ul>
            <table>
            <tr><th>헤더 1</th><th>헤더 2</th></tr>
            <tr><td>내용 1</td><td>내용 2</td></tr>
            </table>`,
    authorEmail: "test@vans-story.com",
    category: "nextjs",
    tags: ["테스트", "태그"],
    thumbnail: "",
    language: "ko"
  }
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
   */
  async onModuleInit() {
    try {
      // 기존 데이터 확인
      const existingPost = await this.postModel.findOne({ title: initialPosts[0].title });

      // 중복 데이터가 없는 경우에만 삽입
      if (!existingPost) {
        await this.postModel.create(initialPosts);
        console.log('✅ 초기 게시글이 성공적으로 생성되었습니다.');
      } else {
        console.log('ℹ️ 초기 게시글이 이미 존재합니다.');
      }
    } catch (error) {
      console.error('❌ 초기 게시글 생성 중 오류 발생:', error);
    }
  }
} 