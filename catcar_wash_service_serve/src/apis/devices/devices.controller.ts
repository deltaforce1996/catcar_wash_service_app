import { Body, Controller, Get, Param, Post, Put, Query, UseFilters, UseGuards, Sse } from '@nestjs/common';
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
  SyncDeviceConfigsDto,
} from './dtos/index';
import { UserAuth } from '../auth/decorators';
import type { AuthenticatedUser } from 'src/types/internal.type';
import { DeviceRegistrationService, DeviceRegistrationEventAdapter } from '../../services';
import { DeviceSignatureGuard } from '../payment-gateway/guards/device-signature.guard';

type DevicePublicResponse = PaginatedResult<DeviceRow | DeviceWithoutRefRow>;

@UseFilters(AllExceptionFilter)
@Controller('api/v1/devices')
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly deviceRegistrationService: DeviceRegistrationService,
    private readonly deviceRegistrationEventAdapter: DeviceRegistrationEventAdapter,
  ) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async createDevice(@Body() data: CreateDeviceDto): Promise<SuccessResponse<DeviceRow>> {
    const result = await this.devicesService.assignDeviceToEmployee(data);
    return {
      success: true,
      data: result,
      message: 'Device created successfully',
    };
  }

  @Put('update-by-id-basic/:id')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  async deviceNeedRegister(
    @Body() data: DeviceNeedRegisterDto,
  ): Promise<SuccessResponse<{ pin: string; device_id: string }>> {
    // Initialize device first (will return existing device if chip_id already exists)
    const device = await this.devicesService.intialDevice(data);

    // Create registration session with the actual device_id
    const session = this.deviceRegistrationService.createRegistrationSession(
      data.chip_id,
      data.mac_address,
      data.firmware_version,
      device.id,
    );

    return {
      success: true,
      data: {
        pin: session.pin,
        device_id: device.id,
      },
      message: 'Device registration session created successfully',
    };
  }

  // Device Sync Configs Endpoint (without JWT guard, use signature guard)
  @Post('sync-configs/:device_id')
  @UseGuards(DeviceSignatureGuard)
  async syncDeviceConfigs(
    @Param('device_id') deviceId: string,
    @Body() data: SyncDeviceConfigsDto,
  ): Promise<SuccessResponse<void>> {
    await this.devicesService.syncConfigsById(deviceId, data);
    return {
      success: true,
      message: 'Device configs synced successfully',
    };
  }

  // SSE endpoint for device scanning

  // @UseGuards(JwtAuthGuard)
  @Get('scan')
  @Sse('device-scan')
  deviceScan(): Observable<{ data: string }> {
    return this.deviceRegistrationEventAdapter.createSSEStream();
  }
}
