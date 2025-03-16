[**Vans Story Backend - Posts Service API Documentation v0.0.1**](README.md)

***

[Vans Story Backend - Posts Service API Documentation](modules.md) / [Service/service](Service\service\README.md) / PostsService

# Class: PostsService

Defined in: [src/Service/service.ts:16](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Service/service.ts#L16)

MongoDB를 사용하는 게시글 관련 비즈니스 로직을 처리하는 서비스 클래스

 PostsService

## Description

게시글의 생성, 조회, 수정, 삭제 등의 비즈니스 로직을 MongoDB를 통해 처리합니다.

## Constructors

### new PostsService()

> **new PostsService**(`postModel`, `apiClient`): `PostsService`

Defined in: [src/Service/service.ts:17](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Service/service.ts#L17)

#### Parameters

##### postModel

`Model`\<[`PostDocument`](schemas\post.schema\README\type-aliases\PostDocument.md)\>

##### apiClient

[`InternalApiClient`](utils\Api\api\README\classes\InternalApiClient.md)

#### Returns

`PostsService`

## Methods

### create()

> **create**(`createDto`, `authorEmail`): `Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>

Defined in: [src/Service/service.ts:38](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Service/service.ts#L38)

새로운 게시글을 생성합니다.

#### Parameters

##### createDto

[`CreateDto`](DTO\dto\README\classes\CreateDto.md)

게시글 생성에 필요한 데이터 (제목, 내용 등)

##### authorEmail

`string`

게시글 작성자의 이메일

#### Returns

`Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>

생성된 게시글 정보 (MongoDB Document)

#### Throws

MongoDB 작업 중 발생한 오류

#### Example

```typescript
const createDto = { title: '제목', content: '내용', theme: 'dark' };
const authorEmail = 'user@example.com';
const newPost = await postsService.create(createDto, authorEmail);
```

***

### findAll()

> **findAll**(`query`): `Promise`\<`Paginated`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>\>

Defined in: [src/Service/service.ts:66](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Service/service.ts#L66)

페이지네이션이 적용된 게시글 목록을 조회합니다.

#### Parameters

##### query

`PaginateQuery`

페이지네이션 쿼리 파라미터

#### Returns

`Promise`\<`Paginated`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>\>

페이지네이션이 적용된 게시글 목록

#### Example

```typescript
const query = { 
  page: 1, 
  limit: 10,
  sortBy: [['createdAt', 'DESC']],
  search: '검색어'
};
const posts = await postsService.findAll(query);
```

***

### findByAuthor()

> **findByAuthor**(`authorEmail`): `Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)[]\>

Defined in: [src/Service/service.ts:191](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Service/service.ts#L191)

특정 작성자의 게시글 목록을 조회합니다.

#### Parameters

##### authorEmail

`string`

작성자의 이메일

#### Returns

`Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)[]\>

작성자의 게시글 목록

#### Example

```typescript
const authorPosts = await postsService.findByAuthor('author@example.com');
```

***

### findByThemeAndCategory()

> **findByThemeAndCategory**(`theme`?, `category`?): `Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)[]\>

Defined in: [src/Service/service.ts:226](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Service/service.ts#L226)

테마와 카테고리로 게시글을 검색합니다.

#### Parameters

##### theme?

`string`

검색할 테마 (옵션)

##### category?

`string`

검색할 카테고리 (옵션)

#### Returns

`Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)[]\>

- 검색 결과 게시글 목록

***

### findOne()

> **findOne**(`id`): `Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>

Defined in: [src/Service/service.ts:110](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Service/service.ts#L110)

특정 ID의 게시글을 조회합니다.

#### Parameters

##### id

`string`

조회할 게시글의 ID

#### Returns

`Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>

조회된 게시글 정보

#### Throws

게시글을 찾을 수 없는 경우

#### Example

```typescript
const post = await postsService.findOne('1');
```

***

### remove()

> **remove**(`id`): `Promise`\<`void`\>

Defined in: [src/Service/service.ts:169](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Service/service.ts#L169)

특정 ID의 게시글을 삭제합니다.

#### Parameters

##### id

`string`

삭제할 게시글의 ID

#### Returns

`Promise`\<`void`\>

#### Throws

게시글을 찾을 수 없는 경우

#### Example

```typescript
await postsService.remove('1');
```

***

### searchPosts()

> **searchPosts**(`keyword`): `Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)[]\>

Defined in: [src/Service/service.ts:207](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Service/service.ts#L207)

키워드로 게시글을 검색합니다.

#### Parameters

##### keyword

`string`

검색 키워드

#### Returns

`Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)[]\>

검색된 게시글 목록

#### Example

```typescript
const searchResults = await postsService.searchPosts('검색어');
```

***

### update()

> **update**(`id`, `updateDto`): `Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>

Defined in: [src/Service/service.ts:141](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Service/service.ts#L141)

특정 ID의 게시글을 수정합니다.

#### Parameters

##### id

`string`

수정할 게시글의 ID

##### updateDto

[`UpdateDto`](DTO\dto\README\classes\UpdateDto.md)

수정할 게시글 데이터

#### Returns

`Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>

수정된 게시글 정보

#### Throws

게시글을 찾을 수 없는 경우

#### Example

```typescript
const updateDto = { title: '수정된 제목' };
const updatedPost = await postsService.update('1', updateDto);
```
