import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  fullname: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  custom_name?: string;
}
