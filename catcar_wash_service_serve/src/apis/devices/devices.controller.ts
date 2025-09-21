import { Body, Controller, Get, Param, Post, Put, Query, UseFilters, UseGuards, Request } from '@nestjs/common';
import { DeviceRow, DeviceWithoutRefRow, DevicesService } from './devices.service';
import { AllExceptionFilter } from 'src/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser, PaginatedResult } from 'src/types/internal.type';
import { SuccessResponse } from 'src/types';
import { UpdateDeviceBasicDto, CreateDeviceDto, SearchDeviceDto, UpdateDeviceConfigsDto } from './dtos/index';

type DevicePublicResponse = PaginatedResult<DeviceRow | DeviceWithoutRefRow>;

@UseFilters(AllExceptionFilter)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('search')
  async searchDevices(
    @Query() q: SearchDeviceDto,
    @Request() req: Request & { user: AuthenticatedUser },
  ): Promise<SuccessResponse<DevicePublicResponse>> {
    const user = req.user;
    console.log(JSON.stringify(user, null, 2));
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
    @Request() req: Request & { user: AuthenticatedUser },
  ): Promise<SuccessResponse<DeviceRow>> {
    const user = req.user;
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
}
