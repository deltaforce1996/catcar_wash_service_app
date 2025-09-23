import { Controller, Get, Query, UseFilters, UseGuards } from '@nestjs/common';
import { PaginatedResult } from 'src/types/internal.type';
import { DeviceStatesService, DeviceStateRow } from './device-states.service';
import { SearchDeviceStatesDto } from './dtos/search-device-states.dto';
import { SuccessResponse } from 'src/types/success-response.type';
import { AllExceptionFilter } from 'src/common';
import { JwtAuthGuard } from 'src/apis/auth/guards/jwt-auth.guard';
import { UserAuth } from '../auth/decorators';
import type { AuthenticatedUser } from 'src/types/internal.type';

type DeviceStatesPublicResponse = PaginatedResult<DeviceStateRow>;

@UseFilters(AllExceptionFilter)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/device-states')
export class DeviceStatesController {
  constructor(private readonly deviceStatesService: DeviceStatesService) {}

  @Get('search')
  async searchDeviceStates(
    @Query() q: SearchDeviceStatesDto,
    @UserAuth() user: AuthenticatedUser,
  ): Promise<SuccessResponse<DeviceStatesPublicResponse>> {
    const result = await this.deviceStatesService.searchDeviceStates(q, user);
    return {
      success: true,
      message: 'Device states fetched successfully',
      data: result,
    };
  }
}
