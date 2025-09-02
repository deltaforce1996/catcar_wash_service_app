import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchDeviceEventLogsDto {
  /**
   * Search query string. Supported fields:
   * - id: Event ID
   * - device_id: Device ID
   * - device_name: Device name (case-insensitive search)
   * - type: Event type (PAYMENT, INFO)
   * - payload_timestemp: Unix timestamp within payload JSON (format: timestamp or start-end range)
   * - time_range: Time range filtering (format: HH:MM-HH:MM, e.g., "12:00-15:00")
   * - user_id: User ID within payload JSON

   * Example: "device_id:abc123 device_name:WASH-001 type:PAYMENT payload_timestemp:1640995200000-1641081600000"
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
  sort_by?: 'created_at' | 'type' | 'device_id';

  @IsString()
  @IsOptional()
  sort_order?: 'asc' | 'desc';
}
