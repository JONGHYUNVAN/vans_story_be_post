---
paths:
  - "test/**"
  - "src/**/*.spec.ts"
---

# 테스트 규칙

- 위치(`docs/conventions.md` 1절): 단위 테스트는 대상 옆 `src/**/*.spec.ts`, `AppModule` 전체를 띄우는 테스트는 `test/app/`, e2e는 `test/*.e2e-spec.ts`. 헬퍼는 `test/helpers/`이고 src spec에서는 `test/helpers/...`로 import한다(tsconfig `paths`·jest `moduleNameMapper`).
- 이름(`docs/conventions.md` 2절 "통일 규칙"): jest.fn 팩토리는 `createMock<토큰 클래스>()`·변수 `mock<토큰 클래스>`, 손으로 짠 구현은 `Fake*`, `TestingModule`은 `moduleRef`, 픽스처 상수는 `UPPER_SNAKE`. 제목은 최상위 describe만 대상 심볼, it은 한국어 "조건 + 결과".
- 실행은 `npm test`뿐이다 (`--experimental-vm-modules`, `*.spec.ts`만). `npm run test:e2e`, `npm run test:all`은 `.env`의 운영 DB에 붙으므로 로컬에서 실행하지 않는다. e2e 파일(`*.e2e-spec.ts`)은 수정만 하고, 실행은 전용 테스트 DB가 생길 때까지 보류.
- Service 단위 테스트는 `test/helpers/post-fixtures.ts`를 쓴다:
  - `createMockPostModel(doc?)`, `createMockCategoryModel(categories?)` — 조회 메서드는 호출마다 새 `createMockQuery` 체인을 돌려준다. Category 모의는 `{ value, parentId: null | ObjectId | { $ne: null } }` 필터를 실제로 평가하고, `findById`도 픽스처에서 찾는다.
  - `createMockQuery(result)` — `populate/select/sort/skip/limit/lean`은 `this`, `exec()`와 `await` 둘 다 `result`. Service가 쓰는 체인 메서드가 늘면 여기에도 추가한다.
  - 픽스처: `POST_ID`, `MAIN_CATEGORY_ID`/`SUB_CATEGORY_ID`(+ `MAIN_CATEGORY_DOC`/`SUB_CATEGORY_DOC`, populate 결과 `POPULATED_*`), `AUTHOR_EMAIL`, `createPostLeanDoc(overrides)`.
  - 기대 응답: `expectedFullResponse` 하나다 — 2026-10-26부터 모든 조회·생성·수정 경로가 `toResponseDto`를 거쳐 `mainCategory`/`mainCategoryLabel`/`subCategory`/`subCategoryLabel`을 채운다(그전에는 findAll/findOne/findForEdit/update가 `subCategory`를 빼고 돌려줘 프런트 수정 화면의 하위 카테고리가 비었다). 날짜는 `toLocaleString()` 문자열.
  - 외부 클라이언트는 프로바이더로 바꾼다: `{ provide: UserServiceClient, useValue: createMockUserServiceClient() }`, `{ provide: SearchServiceClient, useValue: createMockSearchServiceClient() }`. `beforeEach`마다 새로 만들므로 `jest.clearAllMocks()`는 필요 없다. 검증은 `expect(mockSearchServiceClient.indexPost)...`.
- 환경 변수 검증(`src/config/env.validation.spec.ts`): `validateEnv`에 규칙을 추가하면 정상·거부 케이스를 추가한다. 오류 메시지에 값이 들어가지 않는지 확인하는 케이스는 유지한다.
- DTO 픽스처는 `createValidDto(CreatePostDto | UpdatePostDto, overrides)`(`test/helpers/dto-fixtures.ts`) — class-validator를 통과하는 값만 만들고, 실패하면 throw한다. 카테고리 id는 픽스처 카테고리를 가리킨다. DTO 자체의 검증 테스트는 대상 옆 `*.dto.spec.ts`(`plainToInstance` + `validateSync`).
- 모듈 기동 테스트(`test/app/bootstrap.spec.ts`): `import './dummy-env'`가 `AppModule` import보다 앞에 와야 한다 (더미 env, CJS는 import 순서 유지). `withFakeMongoose(Test.createTestingModule({ imports: [AppModule] }), fakeModel)` (`test/helpers/fake-mongoose.ts`) — 연결 프로바이더(`getConnectionToken()`)와 `getModelToken(X.name)`을 `overrideProvider`로 바꿔 연결 팩토리가 실행되지 않게 한다. 새 스키마를 추가하면 헬퍼에 토큰도 추가한다. `overrideModule(MongooseModule)`은 동적 모듈과 일치하지 않아 실제 DB에 연결되므로 쓰지 않는다. `test/app/dummy-env.ts`는 `MONGODB_URI`도 더미로 채운다(옵션 팩토리의 `getOrThrow` 때문).
- 환경 변수 로딩 테스트(`test/app/config.spec.ts`): 임시 디렉터리로 `chdir`하고 `jest.isolateModules`로 `AppModule`을 다시 로드해(`loadFreshModules`) `ConfigModule.forRoot()`가 그 디렉터리의 `.env`를 읽게 한다. 헬퍼도 같은 isolate 안에서 `require`해야 토큰 identity가 맞는다.
- e2e 헬퍼: `FakeJwtAuthGuard`(`Bearer admin_token`=`[Role.Admin]`·`admin@example.com`, `author_token`·`other_user_token`=`[Role.User]`), `FakeUserServiceClient`. 게시글 생성·삭제는 관리자 전용이라 일반 사용자의 글은 API가 아니라 `getModelToken(Post.name)` 모델로 만든다. 게시글 생성은 카테고리 존재를 확인하므로 e2e가 픽스처 id로 카테고리를 만들고 지운다.
- 역할·토큰 동작(401/403)은 bootstrap 테스트에서 실제 `JwtStrategy`·`RolesGuard`로 확인한다: 파일 상단 `signSpringToken(auth, algorithm)`이 `test/app/dummy-env.ts`의 `JWT_SECRET`으로 Spring 형식 토큰을 만들고, 서비스는 `jest.spyOn(moduleRef.get(XService), '메서드')`로 막는다.
- 새 Service 메서드마다 정상 1건 + 예외(`NotFound` / `Forbidden` / `BadRequest`) 각각 테스트한다.
