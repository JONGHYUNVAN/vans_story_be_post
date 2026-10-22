---
name: add-endpoint
description: 이 NestJS 서비스에 새 REST 엔드포인트(라우트·API)를 추가하거나 기존 엔드포인트의 요청/응답을 바꿀 때의 절차. "엔드포인트 추가", "API 추가", "라우트 추가" 요청에 사용.
---

# 엔드포인트 추가 절차

순서대로 진행한다. 각 단계의 세부 규칙은 `.claude/rules/*.md`에 있다.

1. **DTO** (`src/modules/<feature>/dto/`)
   - 요청 DTO: class-validator + `@ApiProperty`. 응답 DTO: `@Field` + `@ApiProperty`. barrel `index.ts`에 export.
   - 응답 필드가 populate/외부 호출로 채워지면 DTO에는 선언만 하고 Service가 채운다.
2. **Service**
   - `Types.ObjectId.isValid(id)` 실패 → `NotFoundException`. 권한은 `userEmail`/`userRole` 인자로 판단해 `ForbiddenException`.
   - 조회 체인은 `.populate('mainCategoryId', 'value label').populate('subCategoryId', 'value label').lean().exec()`. 응답은 `mapToDto(doc, ResponseDto)` 후 파생 필드 채우기.
   - 게시글이 바뀌면 `this.searchIndex.indexPost` / `deletePostIndex`(`SearchIndexClient`)를 fire-and-forget으로 호출하고 `.catch`로 로그만 남긴다.
3. **Controller**
   - 데코레이터 순서(기존 관례): `@ApiOperation` → `@ApiResponse`(성공·401·403·404) → `@ApiParam/@ApiQuery` → `@UseGuards(JwtAuthGuard)` → `@ApiBearerAuth('Authorization')` → HTTP 메서드 데코레이터. 공개 라우트는 가드 없음.
   - 정적 경로(`grouped`, `value/:value`, `:id/edit`)는 `:id`보다 **앞에** 선언한다.
   - 가드를 쓰는 모듈이 `AuthModule`을 import하는지 확인한다 (`CLAUDE.md` 함정 1).
4. **단위 테스트** (`test/<feature>/.../*.spec.ts`): 정상 1건 + 예외 각각. `npm test`.
5. **문서**: `README.md`의 "주요 API 엔드포인트" 목록에 한 줄 추가. `npm run swagger:build:clean`으로 `docs/swagger/clean.html` 재생성(추적되는 파일).
6. **검증**: `npx tsc --noEmit -p tsconfig.json` → `npm test` → 손댄 파일 `npx prettier --check`.
