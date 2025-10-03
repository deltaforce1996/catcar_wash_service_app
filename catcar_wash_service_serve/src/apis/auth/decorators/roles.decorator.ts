import { SetMetadata, applyDecorators } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const ROLE_ERROR_MESSAGE_KEY = 'roleErrorMessage';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const ADMIN = 'ADMIN';
export const TECHNICIAN = 'TECHNICIAN';
export const USER = 'USER';

export const RoleAdmin = () =>
  applyDecorators(
    SetMetadata(ROLES_KEY, [ADMIN]),
    SetMetadata(ROLE_ERROR_MESSAGE_KEY, 'Access denied. Required roles RoleAdmin'),
  );

export const RoleTechnician = () =>
  applyDecorators(
    SetMetadata(ROLES_KEY, [TECHNICIAN]),
    SetMetadata(ROLE_ERROR_MESSAGE_KEY, 'Access denied. Required roles RoleTechnician'),
  );

export const RoleAdminAndTechnician = () =>
  applyDecorators(
    SetMetadata(ROLES_KEY, [ADMIN, TECHNICIAN]),
    SetMetadata(ROLE_ERROR_MESSAGE_KEY, 'Access denied. You need Admin or Technician permissions'),
  );

export const RoleUser = () =>
  applyDecorators(
    SetMetadata(ROLES_KEY, [USER]),
    SetMetadata(ROLE_ERROR_MESSAGE_KEY, 'Access denied. Required roles RoleUser'),
  );
