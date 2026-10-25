# 2026-10-25 카테고리 참조 필드 문자열 저장 복구

## 증상

새 백엔드(`vansdevblog-be-post`, Node 26 / Nest 12)로 등록한 게시글이 상세 조회와 무필터 목록에는 나오지만
`GET /api/v1/posts?mainCategory=nextjs` 같은 카테고리 필터 목록에서는 빠졌다. 기존 글은 정상.

## 원인

`@Prop({ type: Types.ObjectId, ref: 'Category' })`의 `Types.ObjectId`는 bson 클래스다.
@nestjs/mongoose 12의 `DefinitionsFactory.inspectTypeDefinition`은 함수형 `type` 중 mongoose `SchemaType` 자손이 아닌
클래스를 "`@Schema` 클래스"로 보고 `createForClass`를 호출하는데, 메타데이터가 없어 빈 정의 `{}`가 되고 mongoose는 이를 `Mixed`로 등록한다.
그래서 `create`/`findByIdAndUpdate`가 24자리 hex 문자열을 캐스팅 없이 그대로 저장했고, `find({ mainCategoryId: ObjectId })`에 걸리지 않았다
(`populate`는 참조 모델 쪽 `_id` 타입으로 캐스팅해 조회하므로 상세 응답은 멀쩡해 보였다).
영향 필드: `posts.mainCategoryId`, `posts.subCategoryId`, `categories.parentId`.

## 코드 수정 (`fix/category-id-schema-type`)

- 세 `@Prop`의 `type`을 `SchemaTypes.ObjectId`(mongoose `Schema.Types.ObjectId`)로 변경.
- 회귀 테스트: `src/posts/schemas/post.schema.spec.ts`, `src/categories/schemas/category.schema.spec.ts`(경로 instance가 `ObjectId`),
  `test/posts-category-filter.e2e-spec.ts`(API로 만든 글이 필터 목록에 나오고 raw 문서가 ObjectId).
- 규칙 갱신: `.claude/rules/schemas.md`, `docs/conventions.md`.

## 데이터 복구 절차

배포 뒤 한 번 실행한다. 스키마가 고쳐진 상태에서 실행해야 이후 쓰기가 다시 문자열이 되지 않는다.

1. 영향 범위 확인(읽기만): `MONGODB_URI=<Atlas URI> node scripts/migrate-category-id-types.js --dry-run`
   — 컬렉션·필드별 문자열 건수와 변환 가능 건수를 출력한다.
2. 변환: `MONGODB_URI=<Atlas URI> node scripts/migrate-category-id-types.js`
   — `$type: 'string'`이고 `ObjectId.isValid`인 값만 `new ObjectId(value)`로 `$set`한다. 형식이 틀린 값은 건너뛰고 건수만 보고한다.
3. 확인: `GET /api/v1/posts?mainCategory=nextjs`에 해당 글이 나오는지.

Atlas는 허용된 IP에서만 붙는다(이 PC는 미등록). 한 건뿐이면 대안으로 관리자 토큰으로
`PATCH /api/v1/posts/:id`에 같은 `mainCategoryId`/`subCategoryId`를 보내도 새 스키마가 ObjectId로 캐스팅해 저장한다.

로컬 검증: `mongo:7` 컨테이너의 임시 DB에 문자열·ObjectId·잘못된 문자열 문서를 섞어 넣고 dry-run → 실행 → 타입 확인까지 통과(2026-10-25).

알려진 영향 문서: `posts/6ade12e7a26d691e30272c0a`(2026-10-25 등록 샘플 글). 새 백엔드가 www.vansdevblog.online을 받은 2026-10-25 이후 API로 만든 문서가 대상이다.
