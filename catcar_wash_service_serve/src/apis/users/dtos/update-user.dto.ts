import { UserStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fullname?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  custom_name?: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}

export class UpdateUserProfileDto extends UpdateUserDto {
  @IsObject({
    each: true,
  })
  @IsOptional()
  payment_info?: {
    merchant_id?: string;
    api_key?: string;
    HMAC_key?: string;
  };
}
