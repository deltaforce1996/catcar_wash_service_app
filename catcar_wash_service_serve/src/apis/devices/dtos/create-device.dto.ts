import { DeviceType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import type { DeviceConfig } from '../types/device-config.types';

export class CreateDeviceDto {
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
  @IsOptional()
  information?: any;

  @IsObject()
  @IsOptional()
  configs?: DeviceConfig;
}
