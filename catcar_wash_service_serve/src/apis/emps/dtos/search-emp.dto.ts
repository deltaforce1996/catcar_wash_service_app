import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchEmpDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  sort_by?: 'created_at' | 'updated_at' | 'name' | 'email' | 'phone' | 'line' | 'address' | 'status' | 'permission';

  @IsString()
  @IsOptional()
  sort_order?: 'asc' | 'desc';
}
