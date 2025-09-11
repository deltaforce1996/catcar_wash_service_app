import { Controller, Get, Query, UseFilters, UseGuards, Request } from '@nestjs/common';
import { AuthenticatedUser, PaginatedResult } from 'src/types/internal.type';
import { DeviceEventLogsService, DeviceEventLogRow } from './device-event-logs.service';
import { SearchDeviceEventLogsDto } from './dtos/search-devcie-event.dto';
import { SuccessResponse } from 'src/types/success-response.type';
import { AllExceptionFilter } from 'src/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type DeviceEventLogsPublicResponse = PaginatedResult<DeviceEventLogRow>;

@UseFilters(AllExceptionFilter)
@Controller('api/v1/device-event-logs')
export class DeviceEventLogsController {
  constructor(private readonly deviceEventLogsService: DeviceEventLogsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchDeviceEventLogs(
    @Query() q: SearchDeviceEventLogsDto,
    @Request() req: Request & { user: AuthenticatedUser },
  ): Promise<SuccessResponse<DeviceEventLogsPublicResponse>> {
    const user = req.user;
    const result = await this.deviceEventLogsService.searchDeviceEventLogs(q, user);
    return {
      success: true,
      message: 'Device event logs fetched successfully',
      data: result,
    };
  }
}
