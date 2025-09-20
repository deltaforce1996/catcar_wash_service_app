import { DeviceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateDeviceBasicDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;
}
