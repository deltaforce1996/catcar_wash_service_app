import { Body, Controller, Get, Param, Post, Put, Query, UseFilters, UseGuards, Request } from '@nestjs/common';
import { DeviceRow, DevicesService } from './devices.service';
import { AllExceptionFilter } from 'src/common';
import { SearchDeviceDto } from './dtos/search-device.dto';
import { CreateDeviceDto } from './dtos/create-device.dto';
import { UpdateDeviceDto } from './dtos/update-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser, PaginatedResult } from 'src/types/internal.type';
import { SuccessResponse } from 'src/types';
import { PermissionDeniedException } from 'src/errors';

type DevicePublicResponse = PaginatedResult<DeviceRow>;

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

  @Get('by-owner/:ownerId')
  async getDevicesByOwner(
    @Param('ownerId') ownerId: string,
    @Query() q: SearchDeviceDto,
    @Request() req: Request & { user: AuthenticatedUser },
  ): Promise<SuccessResponse<DevicePublicResponse>> {
    const user = req.user;

    // For USER permission, only allow access to their own devices
    if (user.permission?.name === 'USER' && user.id !== ownerId) {
      throw new PermissionDeniedException('Access denied: You can only view your own devices');
    }
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
}
