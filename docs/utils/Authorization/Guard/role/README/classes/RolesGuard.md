[**Vans Story Backend - Posts Service API Documentation v0.0.1**](README.md)

***

[Vans Story Backend - Posts Service API Documentation](modules.md) / [utils/Authorization/Guard/role](utils\Authorization\Guard\role\README.md) / RolesGuard

# Class: RolesGuard

Defined in: [src/utils/Authorization/Guard/role.ts:6](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/utils/Authorization/Guard/role.ts#L6)

## Implements

- `CanActivate`

## Constructors

### new RolesGuard()

> **new RolesGuard**(`reflector`): `RolesGuard`

Defined in: [src/utils/Authorization/Guard/role.ts:7](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/utils/Authorization/Guard/role.ts#L7)

#### Parameters

##### reflector

`Reflector`

#### Returns

`RolesGuard`

## Methods

### canActivate()

> **canActivate**(`context`): `boolean`

Defined in: [src/utils/Authorization/Guard/role.ts:9](https://github.com/JONGHYUNVAN/vans_story_be_post/blob/30670f9b5f4ff4f94181bc9d1b844416ab74ddc8/src/utils/Authorization/Guard/role.ts#L9)

#### Parameters

##### context

`ExecutionContext`

Current execution context. Provides access to details about
the current request pipeline.

#### Returns

`boolean`

Value indicating whether or not the current request is allowed to
proceed.

#### Implementation of

`CanActivate.canActivate`
