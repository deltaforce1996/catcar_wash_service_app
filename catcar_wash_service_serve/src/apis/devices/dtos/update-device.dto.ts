import { DeviceStatus, DeviceType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateDeviceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(DeviceType)
  @IsOptional()
  type?: DeviceType;

  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;

  @IsObject()
  @IsOptional()
  information?: any;

  @IsObject()
  @IsOptional()
  configs?: any;

  @IsString()
  @IsOptional()
  owner_id?: string;
}
