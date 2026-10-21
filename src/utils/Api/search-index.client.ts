/**
 * SearchIndexClient
 *
 * Django 검색 서비스에 게시물 인덱싱 요청을 fire-and-forget 방식으로 전송합니다.
 * 이 모듈의 모든 함수는 에러를 조용히 처리하며 절대 호출자를 차단하지 않습니다.
 *
 * @module utils/Api/search-index.client
 */

import { Logger } from '@nestjs/common';

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

const logger = new Logger('SearchIndex');

/**
 * Django 검색 서비스가 `X-Internal-Key`로 검증하는 키.
 * 사용자 서비스와 같은 `INTERNAL_API_KEY`를 공유한다. 호출 시점에 읽는다(dotenv 호이스팅 때문에 모듈 최상단에서 읽지 않는다).
 */
const internalKey = (): string => process.env.INTERNAL_API_KEY ?? '';

/**
 * Django 검색 서비스에 게시물을 인덱싱(upsert)합니다.
 * fire-and-forget: 에러는 조용히 로그만 남기고 호출자를 차단하지 않습니다.
 */
export async function indexPost(payload: SearchIndexPayload): Promise<void> {
  const searchServiceUrl = process.env.SEARCH_SERVICE_URL;
  if (!searchServiceUrl) {
    logger.warn('SEARCH_SERVICE_URL is not set — skipping index.');
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    await fetch(`${searchServiceUrl}/api/internal/search/index/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': internalKey(),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (err) {
    logger.warn(`Failed to index post: ${(err as Error).message}`);
  }
}

/**
 * Django 검색 서비스에서 게시물 인덱스를 삭제합니다.
 * fire-and-forget: 에러는 조용히 로그만 남기고 호출자를 차단하지 않습니다.
 */
export async function deletePostIndex(postId: string): Promise<void> {
  const searchServiceUrl = process.env.SEARCH_SERVICE_URL;
  if (!searchServiceUrl) {
    logger.warn('SEARCH_SERVICE_URL is not set — skipping delete.');
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    await fetch(`${searchServiceUrl}/api/internal/search/index/${postId}/`, {
      method: 'DELETE',
      headers: {
        'X-Internal-Key': internalKey(),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (err) {
    logger.warn(`Failed to delete post index: ${(err as Error).message}`);
  }
}
