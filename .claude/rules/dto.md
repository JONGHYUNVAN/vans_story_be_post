---
paths:
  - "src/**/dto/**"
  - "src/**/DTO/**"
---

# DTO 규칙

- 요청 DTO(Create/Update)의 모든 속성에 class-validator 데코레이터와 `@ApiProperty` 또는 `@ApiPropertyOptional`을 붙인다. 선택 속성은 `@IsOptional()`을 맨 위에.
- 전역 `ValidationPipe`가 `whitelist + forbidNonWhitelisted`다. 데코레이터가 없는 속성은 조용히 제거되는 게 아니라 **요청 전체가 400으로 거부**된다. 필드를 추가하고 데코레이터를 빠뜨리면 클라이언트가 그 필드를 보내는 순간 전부 실패한다.
- `transform + enableImplicitConversion`이 켜져 있어 쿼리 문자열이 DTO 타입으로 변환된다. ObjectId는 `@IsMongoId()` + `string` 타입으로 받고 Service에서 `Types.ObjectId`로 다룬다.
- Update DTO: category 모듈처럼 `@nestjs/swagger`의 `PartialType(CreateDto)`로 파생하면 검증·Swagger 메타가 함께 상속된다. post 모듈의 `UpdatePostDto`는 수기로 `@IsOptional()`을 붙인 방식이라, 필드를 추가하면 Create·Update 둘 다 고친다.
- 응답 DTO: 속성마다 `@Field`(`src/utils/Mapper/fieldname.extractor`)와 `@ApiProperty`. `@Field`가 없는 속성은 `mapToDto`가 복사하지 않는다. `author`, `mainCategory`, `*Label` 같은 파생 필드는 Service가 채운다.
- `index.ts` barrel에서 export한다. post 모듈은 `CreateDto / UpdateDto / ResponseDto` 별칭도 함께 export한다 (기존 import 호환).
- `Record<string, any>` 외에 `any`를 새로 쓰지 않는다.
