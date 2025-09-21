import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  line?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
