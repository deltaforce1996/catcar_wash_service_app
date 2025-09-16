import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../../../types/internal.type';
import { PermissionDeniedException } from 'src/errors/permission-denied.exception';
import { SELF_UPDATE_KEY } from '../decorators/self-update.decorator';
import { TECHNICIAN } from '../decorators/roles.decorator';

@Injectable()
export class EmpSelfUpdateGuard implements CanActivate {
  private readonly logger = new Logger(EmpSelfUpdateGuard.name);
  constructor(private reflector: Reflector) {
    this.logger.log('EmpSelfUpdateGuard initialized');
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

    this.logger.debug(`Checking emp self-update access for ${requestMethod} ${requestPath} with role: ${userRole}`);

    // Check if this endpoint requires self-update permission
    const requiresSelfUpdate = this.reflector.getAllAndOverride<boolean>(SELF_UPDATE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiresSelfUpdate) {
      // If no self-update decorator, allow access (fallback to other guards)
      return true;
    }

    // Only allow TECHNICIAN role for emp self-update
    if (userRole !== TECHNICIAN) {
      throw new PermissionDeniedException('Access denied. This endpoint is only for TECHNICIAN role');
    }

    // Allow access for authenticated users with TECHNICIAN permission
    this.logger.debug('Emp self-update access granted - user has valid token and TECHNICIAN permission');
    return true;
  }
}
