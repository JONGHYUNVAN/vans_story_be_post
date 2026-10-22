# 아키텍처

게시글·카테고리 서비스의 구조 설명. 작업 규칙은 `CLAUDE.md`, 결정 근거는 `decisions.md`.

## 시스템에서의 위치

```
Vercel vans_story (Next.js BFF)
        │  HTTP, Bearer JWT
        ▼
  이 서비스 (NestJS 12, :3001) ──── MongoDB Atlas (posts, categories)
        │                      ╲
        │ GET /api/v1/users/email/:email   ╲ POST/DELETE /api/internal/search/index/
        │ X-API-KEY                          ╲ X-Internal-Key (fire-and-forget)
        ▼                                     ▼
  Spring 사용자 서비스                   Django 검색 서비스 (Elasticsearch)
```

- 사용자 서비스에서는 작성자 닉네임만 조회한다 (`InternalApiClient.getUserNickname`, 1초 타임아웃, 실패 시 `null` → `'Unknown'`).
- 검색 서비스로는 게시글 생성·수정·삭제를 전송한다 (`SearchIndexClient.indexPost` / `deletePostIndex`, 3초 타임아웃, 실패는 로그만). 응답을 기다리지 않으므로 검색 서비스가 죽어도 게시글 API는 동작한다.
- 두 서비스 모두 `INTERNAL_API_KEY` 하나를 검증한다.

## 요청 흐름

```
HTTP 요청
 → express.json / urlencoded (10mb)
 → express-session (Swagger 인증 상태만 사용)
 → SwaggerAuthMiddleware   (/api/posts/swagger* 경로만. 나머지는 통과)
 → 전역 ValidationPipe     (whitelist, forbidNonWhitelisted, transform, enableImplicitConversion)
 → JwtAuthGuard            (@UseGuards가 붙은 라우트만)
 → Controller              (파라미터 파싱, Swagger 메타)
 → Service                 (검증, 권한, 비즈니스 로직, HttpException)
 → mongoose Model          (.populate(...).lean().exec())
 → mapToDto                (@Field 속성 복사, Date → toLocaleString 문자열)
 → Response DTO            (+ Service가 채우는 author, mainCategory, *Label)
```

- 전역 예외 필터는 없다. Service가 던진 `HttpException`이 Nest 기본 필터로 응답된다.
- `ValidationPipe`는 `main.ts`에서만 등록된다. 테스트에서 `createNestApplication()`을 만들면 파이프가 없다.

## 모듈 구성

| 모듈 | 위치 | 제공 | import |
|---|---|---|---|
| `AppModule` | `src/app.module.ts` | `MongooseModule.forRoot`, `HttpModule` | `PostsModule`, `CategoryModule`, `AuthModule` |
| `PostsModule` | `src/modules/post/Module/module.ts` | `PostsController`, `PostsService`, `InternalApiClient`, `SearchIndexClient`, `PostInitService` | `MongooseModule.forFeature(Post, Category)`, `HttpModule`, `AuthModule` |
| `CategoryModule` | `src/modules/category/module/category.module.ts` | `CategoryController`, `CategoryService` | `MongooseModule.forFeature(Category)`, `AuthModule` |
| `AuthModule` | `src/utils/Authorization/Module/module.ts` | `JwtStrategy`, `RolesGuard`, `Reflector`; exports `PassportModule`, `JwtModule` | `PassportModule`, `JwtModule.register(HS512)` |

`PostsModule`이 `Category` 모델도 등록하는 이유: 게시글 목록 필터가 카테고리 `value`로 `_id`를 찾아야 해서다.

## 인증·권한

```
Authorization: Bearer <JWT>
 → JwtAuthGuard.canActivate   헤더 없음 → 401 NO_AUTH_HEADER, Bearer 아님 → 401 INVALID_TOKEN_FORMAT
 → passport-jwt (JwtStrategy)  JWT_SECRET(base64 디코딩)으로 HS512 검증, 만료 검사
 → JwtStrategy.validate        payload.sub → user.sub(이메일), payload.auth → user.role
 → JwtAuthGuard.handleRequest  JsonWebTokenError → INVALID_TOKEN, TokenExpiredError → TOKEN_EXPIRED
 → request.user = { sub, role }
```

- 토큰은 Spring 사용자 서비스가 발급한다. `auth` 클레임은 Spring의 권한 문자열(`ROLE_ADMIN` 등)이다.
- **권한 검사는 Service 안에서** 한다. `PostsService.update`는 `userRole !== 'admin'`이면 작성자 본인만 허용, `findForEdit`는 작성자 본인만.
- `RolesGuard`와 `@Roles()`는 구현만 있고 어떤 라우트에도 등록되어 있지 않다. `@Roles('admin')`이 붙은 생성·삭제도 실제로는 인증만 검사한다. 활성화하려면 Spring 권한 문자열과 맞춰야 한다 (`TODO.md` 3절 보안).
- Swagger UI(`/api/posts/swagger`)는 별도로 `SWAGGER_ADMIN_PASSWORD` + express-session 쿠키로 보호된다.

## 데이터 모델

### posts

| 필드 | 타입 | 비고 |
|---|---|---|
| `title`, `topic`, `description` | string | 필수 |
| `content` | object | TipTap JSON. 목록 조회에서는 `select('-content')`로 제외 |
| `authorEmail` | string | JWT `sub`. 응답에서는 닉네임 `author`로 변환 |
| `mainCategoryId` | ObjectId → categories | `populate('mainCategoryId', 'value label')` |
| `subCategoryId` | ObjectId → categories | 서브 카테고리(`parentId`가 있는 문서) |
| `tags` | string[] | |
| `viewCount`, `likeCount` | number | `x-viewed: true` 헤더가 없으면 상세 조회마다 `viewCount` +1 |
| `thumbnail` | string? | |
| `language` | string | 기본 `ko` |
| `createdAt`, `updatedAt` | Date | timestamps |

### categories

| 필드 | 타입 | 비고 |
|---|---|---|
| `parentId` | ObjectId \| null | `null`이면 메인, 값이 있으면 서브 |
| `group` | string? | 메인에만. Frontend / Backend / Database / IT / Test / Etc |
| `value` | string | unique. URL 키 |
| `label`, `path` | string | 필수 |
| `description`, `iconName`, `color` | string? | |
| `isActive` | boolean | 기본 true |
| `sortOrder` | number | 기본 0 |

게시글 목록 필터: `?mainCategory=<value>&subCategory=<value>` → Service가 `value`로 카테고리 `_id`를 찾아 `mainCategoryId`/`subCategoryId`로 조회한다. 없는 value면 빈 결과.

## 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| GET | `/api/v1/posts` | 없음 | 목록. `mainCategory`, `subCategory`, `page`, `limit` |
| GET | `/api/v1/posts/:id` | 없음 | 상세. `x-viewed: true`면 조회수 증가 생략 |
| GET | `/api/v1/posts/:id/edit` | JWT | 수정용 조회. 작성자 본인만 |
| POST | `/api/v1/posts` | JWT | 생성 |
| PATCH | `/api/v1/posts/:id` | JWT | 수정. 작성자 본인 또는 `role === 'admin'` |
| DELETE | `/api/v1/posts/:id` | JWT | 삭제 |
| GET | `/api/v1/categories` | 없음 | 목록. `activeOnly` |
| GET | `/api/v1/categories/grouped` | 없음 | `group`별 묶음 |
| GET | `/api/v1/categories/:id` | 없음 | |
| GET | `/api/v1/categories/value/:value` | 없음 | |
| POST | `/api/v1/categories` | JWT | 생성. `value` 중복 → 409 |
| PATCH | `/api/v1/categories/:id` | JWT | 수정 |
| PATCH | `/api/v1/categories/:id/activate`, `.../deactivate` | JWT | `isActive` 토글 |
| DELETE | `/api/v1/categories/:id` | JWT | |
| GET | `/api/posts/swagger` | 세션 | Swagger UI. 비밀번호 로그인 페이지 |

정확한 요청·응답 스키마는 `docs/swagger/clean.html` 또는 실행 중인 서버의 `/api/posts/swagger-json`.

## 적용된 보안 조치

- 전역 `ValidationPipe` `whitelist + forbidNonWhitelisted`: DTO에 없는 속성이 오면 400.
- JWT HS512, 만료 검사, 헤더 형식 검사. 에러 코드(`NO_AUTH_HEADER`, `INVALID_TOKEN`, `TOKEN_EXPIRED`)로 구분.
- CORS는 `CORS_ORIGINS` 목록만, `credentials: true`.
- 요청 본문 10mb 제한.
- Swagger UI는 비밀번호 + 세션 쿠키(`secure`는 production에서만).
- 내부 서비스 호출은 `INTERNAL_API_KEY` 헤더. 소스에 키 리터럴 없음.
- 로그에 접속 문자열·비밀번호·토큰을 남기지 않는다.
- 작성자 이메일은 저장하되 응답에는 닉네임을 함께 내려준다 (`authorEmail`은 그대로 노출된다 — 숨기려면 `ResponseDto`에서 `@Field` 제거).
