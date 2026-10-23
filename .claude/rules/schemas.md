---
paths:
  - "src/**/schemas/**"
---

# 스키마 규칙

- `@Schema({ timestamps: true, collection: '<복수형>' })` 클래스 + `SchemaFactory.createForClass`. `@Prop`만 둔다. 메서드·훅·가상 필드·비즈니스 로직은 Service로.
- Document 타입: 새 스키마는 `export type XDocument = HydratedDocument<X>`, 주입은 `Model<X>` (`docs/conventions.md` 4절 스키마). 기존 `X & Document`는 전수조사 #25에서 바꾼다. timestamps 필드를 타입에서 쓰려면 `CategoryDocument`처럼 `& { createdAt: Date; updatedAt: Date }`를 덧붙인다.
- 참조는 `@Prop({ type: Types.ObjectId, ref: 'Category' })`. `ref` 문자열은 대상 클래스 이름과 같아야 `populate`가 된다.
- 필드를 추가·삭제하면 함께 확인한다:
  - 생성·수정·응답 DTO
  - `test/helpers/post-fixtures.ts`의 `PostLeanDoc` / `createPostLeanDoc` 픽스처와 기대 응답
  - `SearchIndexPayload`(`src/search-service/search-service.client.ts`) — Django 검색 서비스로 보내는 필드
  - `test/app/bootstrap.spec.ts`의 `getModelToken(...)` 목록 (새 스키마일 때)
- 기존 데이터의 마이그레이션이 필요하면 절차를 `docs/history/`에 기록한다 (`CATEGORY_MIGRATION.md` 전례).
