import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchDeviceDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  @IsIn(['created_at', 'updated_at', 'name', 'type', 'status', 'register_at'], {
    message: 'sort_by must be one of: created_at, updated_at, name, type, status, register_at',
  })
  sort_by?: 'created_at' | 'updated_at' | 'name' | 'type' | 'status' | 'register_at';

  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'sort_order must be either "asc" or "desc"' })
  sort_order?: 'asc' | 'desc';
}
