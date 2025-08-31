import { ForbiddenException } from '@nestjs/common';

export class PermissionDeniedException extends ForbiddenException {
  constructor(message?: string) {
    super({
      errorCode: 'PERMISSION_DENIED',
      message: message || 'You are not allowed to perform this action',
    });
  }
}
