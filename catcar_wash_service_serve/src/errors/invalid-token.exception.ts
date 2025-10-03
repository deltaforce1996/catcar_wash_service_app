import { UnauthorizedException } from '@nestjs/common';

export class InvalidTokenException extends UnauthorizedException {
  constructor(message?: string) {
    super({
      errorCode: 'INVALID_TOKEN',
      message: message || 'The provided token is invalid or has expired',
    });
  }
}
