import { Controller, Get, Query, UseFilters } from '@nestjs/common';
import { PaginatedResult } from 'src/types/internal.type';
import { DeviceEventLogsService, DeviceEventLogRow } from './device-event-logs.service';
import { SearchDeviceEventLogsDto } from './dtos/search-devcie-event.dto';
import { SuccessResponse } from 'src/types/success-response.type';
import { AllExceptionFilter } from 'src/common';

type DeviceEventLogsPublicResponse = PaginatedResult<DeviceEventLogRow>;

@UseFilters(AllExceptionFilter)
@Controller('api/v1/device-event-logs')
export class DeviceEventLogsController {
  constructor(private readonly deviceEventLogsService: DeviceEventLogsService) {}

  @Get('search')
  async searchDeviceEventLogs(
    @Query() q: SearchDeviceEventLogsDto,
  ): Promise<SuccessResponse<DeviceEventLogsPublicResponse>> {
    const result = await this.deviceEventLogsService.searchDeviceEventLogs(q);
    return {
      success: true,
      message: 'Device event logs fetched successfully',
      data: result,
    };
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
