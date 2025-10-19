import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

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
  @IsIn(['created_at', 'updated_at', 'fullname', 'email', 'phone', 'address', 'status', 'permission'], {
    message: 'sort_by must be one of: created_at, updated_at, fullname, email, phone, address, status, permission',
  })
  sort_by?: 'created_at' | 'updated_at' | 'fullname' | 'email' | 'phone' | 'address' | 'status' | 'permission';

  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'sort_order must be either "asc" or "desc"' })
  sort_order?: 'asc' | 'desc';

  @IsBoolean()
  @IsOptional()
  exclude_device_counts?: boolean = false;

  @IsString()
  @IsOptional()
  is_minimal?: boolean = false;
}
