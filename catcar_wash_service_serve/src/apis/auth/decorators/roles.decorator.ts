import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const ADMIN = 'ADMIN';
export const TECHNICIAN = 'TECHNICIAN';
export const USER = 'USER';

export const RoleAdmin = () => SetMetadata(ROLES_KEY, [ADMIN]);
export const RoleTechnician = () => SetMetadata(ROLES_KEY, [TECHNICIAN]);
export const RoleUser = () => SetMetadata(ROLES_KEY, [USER]);
