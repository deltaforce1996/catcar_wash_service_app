import { IsObject, IsOptional } from 'class-validator';
import type { DeviceConfig } from '../types/device-config.types';

export class UpdateDeviceConfigsDto {
  @IsObject()
  @IsOptional()
  configs?: DeviceConfig;
}
