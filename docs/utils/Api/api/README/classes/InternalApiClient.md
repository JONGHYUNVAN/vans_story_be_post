[**Vans Story Backend - Posts Service API Documentation v0.0.1**](README.md)

***

[Vans Story Backend - Posts Service API Documentation](modules.md) / [utils/Api/api](utils\Api\api\README.md) / InternalApiClient

# Class: InternalApiClient

Defined in: [src/utils/Api/api.ts:12](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/utils/Api/api.ts#L12)

내부 API 통신을 위한 유틸리티 클래스

 InternalApiClient

## Description

다른 내부 서비스와의 HTTP 통신을 처리합니다.

## Constructors

### new InternalApiClient()

> **new InternalApiClient**(`httpService`): `InternalApiClient`

Defined in: [src/utils/Api/api.ts:16](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/utils/Api/api.ts#L16)

#### Parameters

##### httpService

`HttpService`

#### Returns

`InternalApiClient`

## Methods

### getUserNickname()

> **getUserNickname**(`email`): `Promise`\<`string`\>

Defined in: [src/utils/Api/api.ts:33](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/utils/Api/api.ts#L33)

사용자 닉네임을 조회합니다.

#### Parameters

##### email

`string`

조회할 사용자의 이메일

#### Returns

`Promise`\<`string`\>

사용자 닉네임 또는 null
