import { SetMetadata, applyDecorators } from '@nestjs/common';

export const SELF_UPDATE_KEY = 'selfUpdate';
export const SELF_UPDATE_ERROR_MESSAGE_KEY = 'selfUpdateErrorMessage';

export const SelfUpdate = () =>
  applyDecorators(
    SetMetadata(SELF_UPDATE_KEY, true),
    SetMetadata(SELF_UPDATE_ERROR_MESSAGE_KEY, 'Access denied. You can only update your own profile'),
  );
