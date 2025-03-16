[**Vans Story Backend - Posts Service API Documentation v0.0.1**](README.md)

***

[Vans Story Backend - Posts Service API Documentation](modules.md) / [Controller/controller](Controller\controller\README.md) / PostsController

# Class: PostsController

Defined in: [src/Controller/controller.ts:22](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Controller/controller.ts#L22)

## Constructors

### new PostsController()

> **new PostsController**(`postsService`): `PostsController`

Defined in: [src/Controller/controller.ts:23](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Controller/controller.ts#L23)

#### Parameters

##### postsService

[`PostsService`](Service\service\README\classes\PostsService.md)

#### Returns

`PostsController`

## Methods

### create()

> **create**(`createDto`, `request`): `Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>

Defined in: [src/Controller/controller.ts:32](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Controller/controller.ts#L32)

#### Parameters

##### createDto

[`CreateDto`](DTO\dto\README\classes\CreateDto.md)

##### request

`any`

#### Returns

`Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>

***

### findAll()

> **findAll**(`query`): `Promise`\<`any`\>

Defined in: [src/Controller/controller.ts:39](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Controller/controller.ts#L39)

#### Parameters

##### query

`PaginateQuery`

#### Returns

`Promise`\<`any`\>

***

### findByThemeAndCategory()

> **findByThemeAndCategory**(`theme`?, `category`?): `Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)[]\>

Defined in: [src/Controller/controller.ts:82](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Controller/controller.ts#L82)

#### Parameters

##### theme?

`string`

##### category?

`string`

#### Returns

`Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)[]\>

***

### findOne()

> **findOne**(`id`): `Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>

Defined in: [src/Controller/controller.ts:51](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Controller/controller.ts#L51)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>

***

### remove()

> **remove**(`id`): `Promise`\<`void`\>

Defined in: [src/Controller/controller.ts:75](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Controller/controller.ts#L75)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

***

### update()

> **update**(`id`, `updateDto`): `Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>

Defined in: [src/Controller/controller.ts:63](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/Controller/controller.ts#L63)

#### Parameters

##### id

`string`

##### updateDto

[`UpdateDto`](DTO\dto\README\classes\UpdateDto.md)

#### Returns

`Promise`\<[`ResponseDto`](DTO\dto\README\classes\ResponseDto.md)\>
