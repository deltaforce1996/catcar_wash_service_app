import { BadRequestException as NestBadRequestException } from '@nestjs/common';

export class BadRequestException extends NestBadRequestException {
  constructor(message?: string) {
    super({
      errorCode: 'BAD_REQUEST',
      message: message || 'Invalid request parameters',
    });
  }
}
