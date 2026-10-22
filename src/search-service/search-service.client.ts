/**
 * SearchIndexClient
 *
 * Django 검색 서비스에 게시물 인덱싱 요청을 fire-and-forget 방식으로 전송합니다.
 * 이 클래스의 모든 메서드는 에러를 조용히 처리하며 절대 호출자를 차단하지 않습니다.
 *
 * @module utils/Api/search-index.client
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SearchIndexPayload {
  /** MongoDB _id as string */
  post_id: string;
  title: string;
  description: string;
  /** raw TipTap JSON — Django will extract text */
  content: object;
  /** maps to 'topic' in NestJS schema */
  topic: string;
  tags: string[];
  mainCategory: string;
  subCategory: string;
  language: string;
  /** nickname (not email) */
  author: string;
  /** ISO string */
  createdAt: string;
  /** ISO string */
  updatedAt: string;
}

/**
 * Django 검색 서비스 클라이언트
 *
 * `SEARCH_SERVICE_URL`이 비어 있으면 요청을 건너뛴다. 인증 키는 사용자 서비스와 같은
 * `INTERNAL_API_KEY`를 `X-Internal-Key`로 보낸다.
 */
@Injectable()
export class SearchIndexClient {
  private readonly logger = new Logger('SearchIndex');

  constructor(private readonly config: ConfigService) {}

  /**
   * Django 검색 서비스에 게시물을 인덱싱(upsert)합니다.
   * fire-and-forget: 에러는 조용히 로그만 남기고 호출자를 차단하지 않습니다.
   */
  async indexPost(payload: SearchIndexPayload): Promise<void> {
    const searchServiceUrl = this.config.get<string>('SEARCH_SERVICE_URL');
    if (!searchServiceUrl) {
      this.logger.warn('SEARCH_SERVICE_URL is not set — skipping index.');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      await fetch(`${searchServiceUrl}/api/internal/search/index/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Key': this.config.get<string>('INTERNAL_API_KEY') ?? '',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (err) {
      this.logger.warn(`Failed to index post: ${(err as Error).message}`);
    }
  }

  /**
   * Django 검색 서비스에서 게시물 인덱스를 삭제합니다.
   * fire-and-forget: 에러는 조용히 로그만 남기고 호출자를 차단하지 않습니다.
   */
  async deletePostIndex(postId: string): Promise<void> {
    const searchServiceUrl = this.config.get<string>('SEARCH_SERVICE_URL');
    if (!searchServiceUrl) {
      this.logger.warn('SEARCH_SERVICE_URL is not set — skipping delete.');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      await fetch(`${searchServiceUrl}/api/internal/search/index/${postId}/`, {
        method: 'DELETE',
        headers: {
          'X-Internal-Key': this.config.get<string>('INTERNAL_API_KEY') ?? '',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (err) {
      this.logger.warn(`Failed to delete post index: ${(err as Error).message}`);
    }
  }
}
