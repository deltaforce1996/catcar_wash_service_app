import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { DeviceStatus, PaymentStatus } from '@prisma/client';

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
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;

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
