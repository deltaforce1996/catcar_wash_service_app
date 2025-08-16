import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../../../types/internal.type';
import { PermissionDeniedException } from 'src/errors/permission-denied.exception';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RoleAuthGuard implements CanActivate {
  private readonly logger = new Logger(RoleAuthGuard.name);
  constructor(private reflector: Reflector) {
    this.logger.log('RoleAuthGuard initialized');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    // Check if user exists and has a role
    if (!user || !user.permission?.name) {
      throw new PermissionDeniedException('User does not have a valid role');
    }

    const userRole = user.permission.name;
    const requestPath = request.route?.path || request.url;
    const requestMethod = request.method;

    this.logger.debug(`Checking access for ${requestMethod} ${requestPath} with role: ${userRole}`);

    // Check decorator-based role requirement
    const decoratorRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (decoratorRoles && decoratorRoles.length > 0) {
      this.logger.debug('Decorator roles', decoratorRoles.join(', '));
      const hasDecoratorRole = decoratorRoles.includes(userRole);
      if (!hasDecoratorRole) {
        throw new PermissionDeniedException(
          `Access denied. Required roles: ${decoratorRoles.join(', ')}. User role: ${userRole}`,
        );
      }
      return true;
    }

    // If no decorator is specified, deny access by default
    this.logger.debug('No decorator roles specified, denying access');
    throw new PermissionDeniedException(
      `Access denied. No roles specified for ${requestMethod} ${requestPath}. User role: ${userRole}`,
    );
  }
}
