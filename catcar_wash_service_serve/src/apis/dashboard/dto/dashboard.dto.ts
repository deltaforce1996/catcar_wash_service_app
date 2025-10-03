import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { DeviceStatus, DeviceType, PaymentApiStatus } from '@prisma/client';

export class DashboardFilterDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  device_id?: string;

  @IsOptional()
  @IsEnum(DeviceStatus)
  device_status?: DeviceStatus;

  @IsOptional()
  @IsEnum(DeviceType)
  device_type?: DeviceType;

  @IsOptional()
  @IsEnum(PaymentApiStatus)
  payment_status?: PaymentApiStatus;

  @IsDateString()
  date?: string;

  @IsOptional()
  @Transform(({ value }): boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  include_charts?: boolean;
}
