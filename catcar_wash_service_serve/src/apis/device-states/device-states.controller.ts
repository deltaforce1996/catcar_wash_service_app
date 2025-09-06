import { Controller, Get, Query, UseFilters, UseGuards, Request } from '@nestjs/common';
import { AuthenticatedUser, PaginatedResult } from 'src/types/internal.type';
import { DeviceStatesService, DeviceStateRow } from './device-states.service';
import { SearchDeviceStatesDto } from './dtos/search-device-states.dto';
import { SuccessResponse } from 'src/types/success-response.type';
import { AllExceptionFilter } from 'src/common';
import { JwtAuthGuard } from 'src/apis/auth/guards/jwt-auth.guard';

type DeviceStatesPublicResponse = PaginatedResult<DeviceStateRow>;

@UseFilters(AllExceptionFilter)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/device-states')
export class DeviceStatesController {
  constructor(private readonly deviceStatesService: DeviceStatesService) {}

  @Get('search')
  async searchDeviceStates(
    @Query() q: SearchDeviceStatesDto,
    @Request() req: Request & { user: AuthenticatedUser },
  ): Promise<SuccessResponse<DeviceStatesPublicResponse>> {
    const user = req.user;
    const result = await this.deviceStatesService.searchDeviceStates(q, user);
    return {
      success: true,
      message: 'Device states fetched successfully',
      data: result,
    };
  }
}
