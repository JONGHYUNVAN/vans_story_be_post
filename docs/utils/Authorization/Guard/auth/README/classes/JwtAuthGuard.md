[**Vans Story Backend - Posts Service API Documentation v0.0.1**](README.md)

***

[Vans Story Backend - Posts Service API Documentation](modules.md) / [utils/Authorization/Guard/auth](utils\Authorization\Guard\auth\README.md) / JwtAuthGuard

# Class: JwtAuthGuard

Defined in: [src/utils/Authorization/Guard/auth.ts:17](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/utils/Authorization/Guard/auth.ts#L17)

JWT 인증을 처리하는 가드 클래스

 JwtAuthGuard

## Description

HTTP 요청에 대한 JWT 토큰 검증을 수행합니다.
모든 보호된 라우트에 대해 인증을 처리하며, 
유효하지 않은 토큰이나 만료된 토큰에 대한 예외를 발생시킵니다.

## Extends

- `IAuthGuard`

## Constructors

### new JwtAuthGuard()

> **new JwtAuthGuard**(`jwtService`): `JwtAuthGuard`

Defined in: [src/utils/Authorization/Guard/auth.ts:18](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/utils/Authorization/Guard/auth.ts#L18)

#### Parameters

##### jwtService

`JwtService`

#### Returns

`JwtAuthGuard`

#### Overrides

`AuthGuard('jwt').constructor`

## Methods

### canActivate()

> **canActivate**(`context`): `boolean` \| `Promise`\<`boolean`\> \| `Observable`\<`boolean`\>

Defined in: [src/utils/Authorization/Guard/auth.ts:29](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/utils/Authorization/Guard/auth.ts#L29)

요청에 대한 인증을 수행합니다.

#### Parameters

##### context

`ExecutionContext`

실행 컨텍스트

#### Returns

`boolean` \| `Promise`\<`boolean`\> \| `Observable`\<`boolean`\>

인증 성공 여부

#### Throws

인증 헤더가 없거나 잘못된 경우

#### Overrides

`AuthGuard('jwt').canActivate`

***

### handleRequest()

> **handleRequest**(`err`, `user`, `info`): `any`

Defined in: [src/utils/Authorization/Guard/auth.ts:61](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/utils/Authorization/Guard/auth.ts#L61)

JWT 전략에서 반환된 결과를 처리합니다.

#### Parameters

##### err

`any`

발생한 오류

##### user

`any`

인증된 사용자 정보

##### info

`any`

JWT 전략에서 반환된 추가 정보

#### Returns

`any`

인증된 사용자 정보

#### Throws

인증 실패 시 발생하는 예외

#### Overrides

`AuthGuard('jwt').handleRequest`
