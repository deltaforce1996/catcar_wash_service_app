import { DeviceType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject, ValidateNested } from 'class-validator';
import type { DeviceConfig } from '../../../types/device-config.types';
import type { DeviceInfo } from 'src/types/internal.type';
import { Type } from 'class-transformer';

export class DeviceInfoDto implements DeviceInfo {
  @IsString()
  @IsNotEmpty()
  chip_id: string;

  @IsString()
  @IsNotEmpty()
  mac_address: string;

  @IsString()
  @IsNotEmpty()
  firmware_version: string;
}

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(DeviceType)
  @IsNotEmpty()
  type: DeviceType;

  @IsString()
  @IsNotEmpty()
  owner_id: string;

  @IsString()
  @IsNotEmpty()
  register_by: string;

  @IsObject()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  @IsNotEmpty()
  information: DeviceInfoDto;

  @IsObject()
  @IsOptional()
  configs?: DeviceConfig;
}
