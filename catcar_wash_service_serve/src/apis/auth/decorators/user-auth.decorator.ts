/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from 'src/types/internal.type';

/**
 * Custom parameter decorator to extract the authenticated user from the request
 * Usage: @UserAuth() user: AuthenticatedUser
 * Usage: @UserAuth('id') userId: string
 */
export const UserAuth = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): AuthenticatedUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new Error('User not found in request. Make sure JwtAuthGuard is applied.');
    }

    // If a specific property is requested, return that property
    if (data) {
      return user[data];
    }

    // Otherwise, return the entire user object
    return user;
  },
);
