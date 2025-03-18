/**
 * 역할 기반 접근 제어 데코레이터
 * 
 * 컨트롤러나 핸들러에 필요한 역할을 지정하기 위한 데코레이터를 제공합니다.
 * 
 * @module utils/Authorization/Guard/roles.decorator
 */

import { SetMetadata } from '@nestjs/common';

/**
 * 역할 메타데이터 키
 */
export const ROLES_KEY = 'roles';

/**
 * 역할 기반 접근 제어 데코레이터
 * 
 * 컨트롤러나 라우트 핸들러에 필요한 사용자 역할을 지정합니다.
 * RolesGuard와 함께 사용되어 접근 제어를 수행합니다.
 * 
 * @param {...string[]} roles - 접근 허용할 역할 목록
 * @returns {MethodDecorator & ClassDecorator} 지정된 역할로 설정된 메타데이터 데코레이터
 * 
 * @example
 * ```typescript
 * @Roles('admin')
 * @Get('users')
 * getUsers() {
 *   // 관리자만 접근 가능한 엔드포인트
 * }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
