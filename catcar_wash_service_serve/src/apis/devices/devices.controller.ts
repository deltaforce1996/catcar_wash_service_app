import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseFilters, UseGuards } from '@nestjs/common';
import { DeviceRow, DevicesService } from './devices.service';
import { AllExceptionFilter } from 'src/common';
import { SearchDeviceDto } from './dtos/search-device.dto';
import { CreateDeviceDto } from './dtos/create-device.dto';
import { UpdateDeviceDto } from './dtos/update-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginatedResult } from 'src/types/internal.type';
import { SuccessResponse } from 'src/types';

type DevicePublicResponse = PaginatedResult<DeviceRow>;

@UseFilters(AllExceptionFilter)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('search')
  async searchDevices(@Query() q: SearchDeviceDto): Promise<SuccessResponse<DevicePublicResponse>> {
    const result = await this.devicesService.searchDevices(q);
    return {
      success: true,
      data: result,
      message: 'Devices searched successfully',
    };
  }

  @Get('find-by-id/:id')
  async getDeviceById(@Param('id') id: string): Promise<SuccessResponse<DeviceRow>> {
    const result = await this.devicesService.findById(id);
    return {
      success: true,
      data: result,
      message: 'Device found successfully',
    };
  }

  @Get('by-owner/:ownerId')
  async getDevicesByOwner(
    @Param('ownerId') ownerId: string,
    @Query() q: SearchDeviceDto,
  ): Promise<SuccessResponse<DevicePublicResponse>> {
    const result = await this.devicesService.getDevicesByOwner(ownerId, q);
    return {
      success: true,
      data: result,
      message: 'Devices found successfully',
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

  @Put('update-by-id/:id')
  async updateDeviceById(@Param('id') id: string, @Body() data: UpdateDeviceDto): Promise<SuccessResponse<DeviceRow>> {
    const result = await this.devicesService.updateById(id, data);
    return {
      success: true,
      data: result,
      message: 'Device updated successfully',
    };
  }

  @Delete('delete-by-id/:id')
  async deleteDeviceById(@Param('id') id: string): Promise<SuccessResponse<DeviceRow>> {
    const result = await this.devicesService.deleteById(id);
    return {
      success: true,
      data: result,
      message: 'Device deleted successfully',
    };
  }
}
