[**Vans Story Backend - Posts Service API Documentation v0.0.1**](README.md)

***

[Vans Story Backend - Posts Service API Documentation](modules.md) / [utils/Authorization/Strategy/strategy](utils\Authorization\Strategy\strategy\README.md) / JwtStrategy

# Class: JwtStrategy

Defined in: [src/utils/Authorization/Strategy/strategy.ts:16](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/utils/Authorization/Strategy/strategy.ts#L16)

JWT 인증 전략을 구현하는 클래스

 JwtStrategy

## Description

JWT 토큰의 추출 및 검증을 담당하는 Passport 전략을 구현합니다.
Authorization 헤더의 Bearer 토큰을 추출하고, 
환경 변수에 설정된 비밀 키를 사용하여 토큰을 검증합니다.

## Extends

- `Strategy`\<`this`\> & `PassportStrategyMixin`\<`unknown`, `this`\>

## Constructors

### new JwtStrategy()

> **new JwtStrategy**(): `JwtStrategy`

Defined in: [src/utils/Authorization/Strategy/strategy.ts:26](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/utils/Authorization/Strategy/strategy.ts#L26)

JWT 전략 설정을 초기화합니다.

#### Returns

`JwtStrategy`

#### Description

- jwtFromRequest: Authorization 헤더에서 Bearer 토큰을 추출
- ignoreExpiration: 토큰 만료 검사 활성화
- secretOrKey: 환경 변수에서 JWT 비밀 키를 가져와 base64로 디코딩

#### Overrides

`PassportStrategy(Strategy).constructor`

## Methods

### validate()

> **validate**(`payload`): `Promise`\<\{ `email`: `any`; `role`: `any`; \}\>

Defined in: [src/utils/Authorization/Strategy/strategy.ts:51](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/utils/Authorization/Strategy/strategy.ts#L51)

JWT 페이로드를 검증하고 사용자 정보를 추출합니다.

#### Parameters

##### payload

`any`

JWT 토큰에서 추출된 페이로드

#### Returns

`Promise`\<\{ `email`: `any`; `role`: `any`; \}\>

검증된 사용자 정보

#### Description

토큰의 페이로드에서 이메일(sub)과 권한(auth) 정보를 추출하여 반환합니다.
이 정보는 Request 객체의 user 속성으로 주입됩니다.

#### Example

```ts
// JWT 페이로드 예시
{
  "sub": "user@example.com",
  "auth": "user",
  "iat": 1516239022
}
```

#### Overrides

`PassportStrategy(Strategy).validate`
