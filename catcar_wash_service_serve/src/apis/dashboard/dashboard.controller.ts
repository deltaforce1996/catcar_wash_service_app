import { Controller, Get, Query, UseFilters } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard.dto';
import { AllExceptionFilter } from 'src/common';
import { SuccessResponse } from 'src/types';

@UseFilters(AllExceptionFilter)
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getDashboardSummary(@Query() filter: DashboardFilterDto): Promise<SuccessResponse<any>> {
    const result = await this.dashboardService.getDashboardSummary(filter);
    return {
      success: true,
      data: result,
      message: 'Dashboard summary retrieved successfully',
    };
  }
}
