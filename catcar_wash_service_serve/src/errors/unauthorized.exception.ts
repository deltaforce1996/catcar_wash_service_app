import { UnauthorizedException as NestUnauthorizedException } from '@nestjs/common';

export class UnauthorizedException extends NestUnauthorizedException {
  constructor(message?: string) {
    super({
      errorCode: 'UNAUTHORIZED',
      message: message || 'You are not authorized to access this resource',
    });
  }
}
