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
