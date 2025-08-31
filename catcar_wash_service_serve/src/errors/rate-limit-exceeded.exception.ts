import { HttpException, HttpStatus } from '@nestjs/common';

export class RateLimitExceededException extends HttpException {
  constructor(message?: string) {
    super(
      {
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: message || 'Too many requests, please try again later',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
