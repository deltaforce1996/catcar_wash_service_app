import { NotFoundException } from '@nestjs/common';

export class ItemNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super({
      errorCode: 'ITEM_NOT_FOUND',
      message: message || 'Item not found',
    });
  }
}
