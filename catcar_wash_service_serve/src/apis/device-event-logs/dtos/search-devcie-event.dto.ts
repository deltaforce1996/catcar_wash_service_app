import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchDeviceEventLogsDto {
  /**
   * Search query string. Supported fields:
   * - id: Event ID
   * - device_id: Device ID
   * - type: Event type (PAYMENT, INFO)
   * - payload_timestemp: Unix timestamp within payload JSON (format: YYYY-MM-DD)
   * - time_range: Time range filtering (format: HH:MM-HH:MM, e.g., "12:00-15:00")
   * - payment_type: Payment type within payload JSON
   * - user_id: User ID within payload JSON
   * - has_qr: Check if QR payment amount > 0 (true/false)
   * - has_bank: Check if bank payment amount > 0 (true/false)
   * - has_coin: Check if coin payment amount > 0 (true/false)
   * - type_log: Type log within payload JSON
   *
   * Example: "device_id:abc123 type:PAYMENT has_qr:true time_range:12:00-15:00"
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
