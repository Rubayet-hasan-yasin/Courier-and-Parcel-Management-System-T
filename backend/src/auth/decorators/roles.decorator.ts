import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../user/enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 * Specifies which roles are allowed to access an endpoint
 * Usage: @Roles(UserRole.ADMIN, UserRole.DELIVERY_AGENT)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
