import { Controller, Get, Query } from '@nestjs/common';
import { PaginatedResult } from 'src/types/internal.type';
import { DeviceEventLogsService, DeviceEventLogRow } from './device-event-logs.service';
import { SearchDeviceEventLogsDto } from './dtos/search-devcie-event.dto';

type DeviceEventLogsPublicResponse = PaginatedResult<DeviceEventLogRow>;

@Controller('api/v1/device-event-logs')
export class DeviceEventLogsController {
  constructor(private readonly deviceEventLogsService: DeviceEventLogsService) {}

  @Get('search')
  searchDeviceEventLogs(@Query() q: SearchDeviceEventLogsDto): Promise<DeviceEventLogsPublicResponse> {
    return this.deviceEventLogsService.searchDeviceEventLogs(q);
  }
}

// // Find payments with QR amount > 0 during lunch hours
// "type:PAYMENT has_qr:true time_range:12:00-15:00"

// // Find payments with bank amount > 0 but no coins
// "type:PAYMENT has_bank:true has_coin:false"

// // Find payments with any amount > 0 in afternoon
// "type:PAYMENT has_qr:true time_range:13:00-18:00"

// // Complex search with multiple payment methods
// "device_id:abc123 has_qr:true has_bank:true has_coin:false"
