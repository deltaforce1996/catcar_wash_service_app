import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  device_id: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  payment_method?: string; // TODO: เปลี่ยนเป็น enum เมื่อมี PaymentMethod enum

  @IsString()
  @IsOptional()
  reference_id?: string;

  @IsString()
  @IsOptional()
  callback_url?: string;
}
