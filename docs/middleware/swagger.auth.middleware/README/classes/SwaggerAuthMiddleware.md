[**Vans Story Backend - Posts Service API Documentation v0.0.1**](README.md)

***

[Vans Story Backend - Posts Service API Documentation](modules.md) / [middleware/swagger.auth.middleware](middleware\swagger.auth.middleware\README.md) / SwaggerAuthMiddleware

# Class: SwaggerAuthMiddleware

Defined in: [src/middleware/swagger.auth.middleware.ts:16](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/middleware/swagger.auth.middleware.ts#L16)

## Implements

- `NestMiddleware`

## Constructors

### new SwaggerAuthMiddleware()

> **new SwaggerAuthMiddleware**(): `SwaggerAuthMiddleware`

#### Returns

`SwaggerAuthMiddleware`

## Methods

### use()

> **use**(`req`, `res`, `next`): `void` \| `Response`\<`any`, `Record`\<`string`, `any`\>\>

Defined in: [src/middleware/swagger.auth.middleware.ts:17](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/middleware/swagger.auth.middleware.ts#L17)

#### Parameters

##### req

`CustomRequest`

##### res

`Response`

##### next

`NextFunction`

#### Returns

`void` \| `Response`\<`any`, `Record`\<`string`, `any`\>\>

#### Implementation of

`NestMiddleware.use`
