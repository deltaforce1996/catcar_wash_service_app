import { FirmwareVariants } from './firmware-metadata.dto';

export interface UploadFirmwareResponse {
  version: string;
  type: 'carwash' | 'helmet';
  files: FirmwareVariants;
  message: string;
}
