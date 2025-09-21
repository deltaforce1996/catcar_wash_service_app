import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchDeviceStatesDto {
  /**
   * Search query string. Supported fields:
   * - id: State ID
   * - device_id: Device ID
   * - device_name: Device name (case-insensitive search)
   * - status: Device state status (normal, error)
   * - payload_timestamp: Unix timestamp within payload JSON (format: timestamp or start-end range)
   *
   * Example: "device_id:abc123 device_name:WASH-001 status:normal payload_timestamp:1640995200000-1641081600000"
   */
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
  @IsIn(['created_at', 'device_id'], { message: 'sort_by must be either "created_at" or "device_id"' })
  sort_by?: 'created_at' | 'device_id';

  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'sort_order must be either "asc" or "desc"' })
  sort_order?: 'asc' | 'desc';
}
