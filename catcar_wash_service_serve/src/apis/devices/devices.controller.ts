import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseFilters,
  UseGuards,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DeviceRow, DeviceWithoutRefRow, DevicesService } from './devices.service';
import { AllExceptionFilter } from 'src/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginatedResult } from 'src/types/internal.type';
import type { SuccessResponse } from 'src/types';
import {
  UpdateDeviceBasicDto,
  CreateDeviceDto,
  SearchDeviceDto,
  UpdateDeviceConfigsDto,
  DeviceNeedRegisterDto,
} from './dtos/index';
import { UserAuth } from '../auth/decorators';
import type { AuthenticatedUser } from 'src/types/internal.type';
import { DeviceRegistrationService, DeviceRegistrationEventAdapter } from '../../services';

type DevicePublicResponse = PaginatedResult<DeviceRow | DeviceWithoutRefRow>;

@UseFilters(AllExceptionFilter)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/devices')
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly deviceRegistrationService: DeviceRegistrationService,
    private readonly deviceRegistrationEventAdapter: DeviceRegistrationEventAdapter,
  ) {}

  @Get('search')
  async searchDevices(
    @Query() q: SearchDeviceDto,
    @UserAuth() user: AuthenticatedUser,
  ): Promise<SuccessResponse<DevicePublicResponse>> {
    const result = await this.devicesService.searchDevices(q, user);
    return {
      success: true,
      data: result,
      message: 'Devices searched successfully',
    };
  }

  @Get('find-by-id/:id')
  async getDeviceById(
    @Param('id') id: string,
    @UserAuth() user: AuthenticatedUser,
  ): Promise<SuccessResponse<DeviceRow>> {
    const result = await this.devicesService.findById(id, user);
    return {
      success: true,
      data: result,
      message: 'Device found successfully',
    };
  }

  @Post('create')
  async createDevice(@Body() data: CreateDeviceDto): Promise<SuccessResponse<DeviceRow>> {
    const result = await this.devicesService.createDevice(data);
    return {
      success: true,
      data: result,
      message: 'Device created successfully',
    };
  }

  @Put('update-by-id-basic/:id')
  async updateDeviceBasicById(
    @Param('id') id: string,
    @Body() data: UpdateDeviceBasicDto,
  ): Promise<SuccessResponse<DeviceRow>> {
    const result = await this.devicesService.updateBasicById(id, data);
    return {
      success: true,
      data: result,
      message: 'Device updated successfully',
    };
  }

  @Put('update-configs/:id')
  async updateDeviceConfigsById(
    @Param('id') id: string,
    @Body() data: UpdateDeviceConfigsDto,
  ): Promise<SuccessResponse<DeviceRow>> {
    const result = await this.devicesService.updateConfigsById(id, data);
    return {
      success: true,
      data: result,
      message: 'Device configurations updated successfully',
    };
  }

  // Device Registration Endpoints (without JWT guard for device requests)
  @Post('need-register')
  @UseFilters(AllExceptionFilter)
  deviceNeedRegister(@Body() data: DeviceNeedRegisterDto): SuccessResponse<{ pin: string; device_id: string }> {
    const session = this.deviceRegistrationService.createRegistrationSession(
      data.chip_id,
      data.mac_address,
      data.firmware_version,
    );

    // Generate a temporary device_id for tracking (will be replaced when actually registered)
    const tempDeviceId = `temp-${data.chip_id}`;

    return {
      success: true,
      data: {
        pin: session.pin,
        device_id: tempDeviceId,
      },
      message: 'Device registration session created successfully',
    };
  }

  // SSE endpoint for device scanning
  @Get('scan')
  @Sse('device-scan')
  deviceScan(): Observable<{ data: string }> {
    return this.deviceRegistrationEventAdapter.createSSEStream();
  }
}
