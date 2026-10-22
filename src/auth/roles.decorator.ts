/**
 * 역할 기반 접근 제어 데코레이터
 * 
 * 컨트롤러나 핸들러에 필요한 역할을 지정하기 위한 데코레이터를 제공합니다.
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from './role.enum';

/**
 * 역할 메타데이터 키
 */
export const ROLES_KEY = 'roles';

/**
 * 역할 기반 접근 제어 데코레이터
 * 
 * 컨트롤러나 라우트 핸들러에 필요한 사용자 역할을 지정합니다.
 * `@UseGuards(JwtAuthGuard, RolesGuard)`와 함께 써야 효력이 있습니다.
 *
 * @param roles - 접근 허용할 역할 목록 (하나라도 있으면 허용)
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(Role.Admin)
 * @Delete(':id')
 * remove() {}
 * ```
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
