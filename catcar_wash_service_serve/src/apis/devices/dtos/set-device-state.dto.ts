import { IsEnum, IsNotEmpty } from 'class-validator';
import { DeviceStatus } from '@prisma/client';

export class SetDeviceStateDto {
  @IsEnum(DeviceStatus)
  @IsNotEmpty()
  status: DeviceStatus;
}
