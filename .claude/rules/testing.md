---
paths:
  - "test/**"
---

# 테스트 규칙

- 실행은 `npm test`뿐이다 (`--experimental-vm-modules`, `*.spec.ts`만). `npm run test:e2e`, `npm run test:all`은 `.env`의 운영 DB에 붙으므로 로컬에서 실행하지 않는다. e2e 파일(`*.e2e-spec.ts`)은 수정만 하고, 실행은 전용 테스트 DB가 생길 때까지 보류.
- Service 단위 테스트는 `test/helpers/test-utils.ts`를 쓴다:
  - `createMockPostModel(doc?)`, `createMockCategoryModel(categories?)` — 조회 메서드는 호출마다 새 `mockQuery` 체인을 돌려준다. Category 모의는 `{ value, parentId: null | ObjectId | { $ne: null } }` 필터를 실제로 평가한다.
  - `mockQuery(result)` — `populate/select/sort/skip/limit/lean`은 `this`, `exec()`와 `await` 둘 다 `result`. Service가 쓰는 체인 메서드가 늘면 여기에도 추가한다.
  - 기대 응답: `expectedMainCategoryOnlyResponse`(findAll/findOne/findForEdit/update 경로), `expectedEnrichedResponse`(create/findByAuthor/searchPosts/findByThemeAndCategory 경로). 날짜는 `toLocaleString()` 문자열.
  - 검색 클라이언트는 모듈째 모킹: `jest.mock('<상대경로>/search-index.client', () => ({ indexPost: jest.fn().mockResolvedValue(undefined), deletePostIndex: ... }))` 후 `beforeEach`에서 `jest.clearAllMocks()`.
- DTO 모의 데이터는 `MockGenerator.createMock(CreateDto, overrides)` — class-validator를 통과하는 값만 만들고, 실패하면 throw한다.
- 모듈 기동 테스트(`test/app/bootstrap.spec.ts`): `import './env'`가 `AppModule` import보다 앞에 와야 한다 (더미 env, CJS는 import 순서 유지). `withFakeMongoose(Test.createTestingModule({ imports: [AppModule] }), fakeModel)` (`test/helpers/fake-mongoose.ts`) — 연결 프로바이더(`getConnectionToken()`)와 `getModelToken(X.name)`을 `overrideProvider`로 바꿔 연결 팩토리가 실행되지 않게 한다. 새 스키마를 추가하면 헬퍼에 토큰도 추가한다. `overrideModule(MongooseModule)`은 동적 모듈과 일치하지 않아 실제 DB에 연결되므로 쓰지 않는다.
- e2e 헬퍼: `MockAuthModule`, `TestAuthGuard`(`Bearer test_token`=admin, `author_token`, `other_user_token`), `MockInternalApiClient`.
- 새 Service 메서드마다 정상 1건 + 예외(`NotFound` / `Forbidden` / `BadRequest`) 각각 테스트한다.
