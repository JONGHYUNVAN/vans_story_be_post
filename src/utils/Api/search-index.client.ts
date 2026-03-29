/**
 * SearchIndexClient
 *
 * Django 검색 서비스에 게시물 인덱싱 요청을 fire-and-forget 방식으로 전송합니다.
 * 이 모듈의 모든 함수는 에러를 조용히 처리하며 절대 호출자를 차단하지 않습니다.
 *
 * @module utils/Api/search-index.client
 */

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

const INTERNAL_KEY = 'vansdevbloguserinternalapikey1234567890!';

/**
 * Django 검색 서비스에 게시물을 인덱싱(upsert)합니다.
 * fire-and-forget: 에러는 조용히 로그만 남기고 호출자를 차단하지 않습니다.
 */
export async function indexPost(payload: SearchIndexPayload): Promise<void> {
  const searchServiceUrl = process.env.SEARCH_SERVICE_URL;
  if (!searchServiceUrl) {
    console.warn('[SearchIndex] SEARCH_SERVICE_URL is not set — skipping index.');
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    await fetch(`${searchServiceUrl}/api/internal/search/index/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': INTERNAL_KEY,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (err) {
    console.warn('[SearchIndex] Failed to index post:', (err as Error).message);
  }
}

/**
 * Django 검색 서비스에서 게시물 인덱스를 삭제합니다.
 * fire-and-forget: 에러는 조용히 로그만 남기고 호출자를 차단하지 않습니다.
 */
export async function deletePostIndex(postId: string): Promise<void> {
  const searchServiceUrl = process.env.SEARCH_SERVICE_URL;
  if (!searchServiceUrl) {
    console.warn('[SearchIndex] SEARCH_SERVICE_URL is not set — skipping delete.');
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    await fetch(`${searchServiceUrl}/api/internal/search/index/${postId}/`, {
      method: 'DELETE',
      headers: {
        'X-Internal-Key': INTERNAL_KEY,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (err) {
    console.warn('[SearchIndex] Failed to delete post index:', (err as Error).message);
  }
}
