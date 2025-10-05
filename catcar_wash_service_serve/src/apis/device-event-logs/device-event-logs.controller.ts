import { Controller, Get, Post, Query, Body, UseFilters, UseGuards } from '@nestjs/common';
import { PaginatedResult } from 'src/types/internal.type';
import { DeviceEventLogsService, DeviceEventLogRow } from './device-event-logs.service';
import { SearchDeviceEventLogsDto } from './dtos/search-devcie-event.dto';
import { UploadLogsDto } from './dtos/upload-logs.dto';
import { SuccessResponse } from 'src/types/success-response.type';
import { AllExceptionFilter } from 'src/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserAuth } from '../auth/decorators';
import type { AuthenticatedUser } from 'src/types/internal.type';

type DeviceEventLogsPublicResponse = PaginatedResult<DeviceEventLogRow>;

@UseFilters(AllExceptionFilter)
@Controller('api/v1/device-event-logs')
export class DeviceEventLogsController {
  constructor(private readonly deviceEventLogsService: DeviceEventLogsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchDeviceEventLogs(
    @Query() q: SearchDeviceEventLogsDto,
    @UserAuth() user: AuthenticatedUser,
  ): Promise<SuccessResponse<DeviceEventLogsPublicResponse>> {
    const result = await this.deviceEventLogsService.searchDeviceEventLogs(q, user);
    return {
      success: true,
      message: 'Device event logs fetched successfully',
      data: result,
    };
  }

  @Post('upload')
  async uploadDeviceEventLogs(
    @Body() uploadLogsDto: UploadLogsDto,
  ): Promise<SuccessResponse<{ created_count: number }>> {
    const result = await this.deviceEventLogsService.uploadDeviceEventLogs(uploadLogsDto);
    return {
      success: true,
      message: 'Device event logs uploaded successfully',
      data: result,
    };
  }
}
