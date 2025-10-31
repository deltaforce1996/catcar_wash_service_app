import { IsOptional, IsString } from 'class-validator';

export class UpdateDeviceBasicDto {
  @IsString()
  @IsOptional()
  name?: string;

  // @IsEnum(DeviceStatus)
  // @IsOptional()
  // status?: DeviceStatus;
}
