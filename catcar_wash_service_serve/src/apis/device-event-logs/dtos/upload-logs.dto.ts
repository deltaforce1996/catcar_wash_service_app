import { IsString, IsArray, IsObject, IsNumber, IsIn, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType, PaymentApiStatus } from '@prisma/client';

export class QrPaymentDto {
  @IsString()
  chargeId: string;

  @IsNumber()
  net_amount: number;
}

export class BankPaymentDto {
  @IsNumber()
  @IsOptional()
  '20'?: number;

  @IsNumber()
  @IsOptional()
  '50'?: number;

  @IsNumber()
  @IsOptional()
  '100'?: number;

  @IsNumber()
  @IsOptional()
  '500'?: number;

  @IsNumber()
  @IsOptional()
  '1000'?: number;
}

export class CoinPaymentDto {
  @IsNumber()
  @IsOptional()
  '1'?: number;

  @IsNumber()
  @IsOptional()
  '2'?: number;

  @IsNumber()
  @IsOptional()
  '5'?: number;

  @IsNumber()
  @IsOptional()
  '10'?: number;
}

export class PaymentItemDto {
  @IsObject()
  @IsOptional()
  qr?: QrPaymentDto;

  @IsObject()
  @IsOptional()
  bank?: BankPaymentDto;

  @IsObject()
  @IsOptional()
  coin?: CoinPaymentDto;

  @IsString()
  @IsIn(['PAYMENT', 'INFO'])
  type: EventType;

  @IsString()
  @IsIn(['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED'])
  status: PaymentApiStatus;

  @IsNumber()
  timestamp: number;

  @IsNumber()
  total_amount: number;
}

export class UploadLogsDto {
  @IsString()
  device_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  items: PaymentItemDto[];
}
