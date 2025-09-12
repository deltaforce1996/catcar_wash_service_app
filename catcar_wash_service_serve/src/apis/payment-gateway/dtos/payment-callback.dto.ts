import { IsString, IsNumber, IsOptional } from 'class-validator';

export class PaymentCallbackDto {
  @IsString()
  payment_id: string;

  @IsString()
  @IsOptional()
  transaction_id?: string;

  @IsString()
  @IsOptional()
  status?: string; // TODO: เปลี่ยนเป็น enum เมื่อมี PaymentStatus enum

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  gateway_response?: string;

  @IsString()
  @IsOptional()
  error_message?: string;

  @IsString()
  @IsOptional()
  signature?: string;
}
