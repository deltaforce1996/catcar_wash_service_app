import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchUserDto {
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
  sort_by?: 'created_at' | 'updated_at' | 'fullname' | 'email' | 'phone' | 'address' | 'status' | 'permission';

  @IsString()
  @IsOptional()
  sort_order?: 'asc' | 'desc';
}
