import { IsString, IsOptional } from 'class-validator';

export class CreateRefundDto {
  @IsString()
  chargeId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
