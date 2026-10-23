/**
 * 게시글 수정 DTO
 *
 * 기존 게시글을 수정할 때 클라이언트에서 서버로 전송되는 데이터 구조를 정의합니다.
 * 모든 필드가 선택적(optional)이며, 제공된 필드만 업데이트됩니다.
 */

import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';

/**
 * 게시글 수정 DTO 클래스
 *
 * `CreatePostDto`의 검증·Swagger 메타를 그대로 물려받고 모든 필드를 생략 가능하게 만든다.
 * `skipNullProperties: false`라 `null`은 생략으로 보지 않고 검증한다 — 필수 필드(`title`,
 * `description` 등)를 `null`로 덮어쓰는 요청은 400이다. 원래 선택 필드(`thumbnail`)는
 * `CreatePostDto`의 `@IsOptional()` 때문에 `null`을 그대로 받는다.
 */
export class UpdatePostDto extends PartialType(CreatePostDto, {
  skipNullProperties: false,
}) {}
