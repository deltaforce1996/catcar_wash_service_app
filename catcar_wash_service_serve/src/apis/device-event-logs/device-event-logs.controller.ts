import { Controller, Get, Post, Patch, Query, Body, UseFilters, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PaginatedResult } from 'src/types/internal.type';
import { DeviceEventLogsService, DeviceEventLogRow } from 'src/services/adepters/device-event-logs.service';
import { SearchDeviceEventLogsDto } from './dtos/search-devcie-event.dto';
import { UploadLogsDto } from './dtos/upload-logs.dto';
import { CancelEventLogDto } from './dtos/cancel-event-log.dto';
import { SuccessResponse } from 'src/types/success-response.type';
import { AllExceptionFilter } from 'src/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserAuth } from '../auth/decorators';
import type { AuthenticatedUser } from 'src/types/internal.type';
import { DeviceSignatureGuard } from '../payment-gateway/guards/device-signature.guard';

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

  @UseGuards(JwtAuthGuard)
  @Get('export')
  async exportDeviceEventLogs(
    @UserAuth() user: AuthenticatedUser,
    @Res() res: Response,
    @Query('date') dateTimestamp?: string,
  ): Promise<void> {
    // Convert timestamp to Date object, default to current date
    const selectedDate = dateTimestamp ? new Date(Number(dateTimestamp)) : new Date();

    const excelBuffer = await this.deviceEventLogsService.exportMonthToExcel(selectedDate, user);

    // Format filename as YYYY-MM
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const filename = `device-event-logs-${year}-${month}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);
  }

  @UseGuards(DeviceSignatureGuard)
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

  @UseGuards(JwtAuthGuard)
  @Patch('cancel')
  async cancelEventLog(
    @Body() cancelDto: CancelEventLogDto,
    @UserAuth() user: AuthenticatedUser,
  ): Promise<SuccessResponse<DeviceEventLogRow>> {
    const result = await this.deviceEventLogsService.cancelEventLog(cancelDto.eventLogId, user);
    return {
      success: true,
      message: 'Event log cancelled successfully',
      data: result,
    };
  }
}
