import { Controller, Get, Query, UseFilters, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard.dto';
import { AllExceptionFilter } from 'src/common';
import { SuccessResponse } from 'src/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserAuth } from '../auth/decorators';
import type { AuthenticatedUser } from 'src/types/internal.type';

@UseFilters(AllExceptionFilter)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getDashboardSummary(
    @Query() filter: DashboardFilterDto,
    @UserAuth() user: AuthenticatedUser,
  ): Promise<SuccessResponse<any>> {
    const result = await this.dashboardService.getDashboardSummary(filter, user);
    return {
      success: true,
      data: result,
      message: 'Dashboard summary retrieved successfully',
    };
  }

  @Get('sync-materialized-views')
  async syncMaterializedViews(): Promise<SuccessResponse<any>> {
    await this.dashboardService.syncMaterializedViews();
    return {
      success: true,
      data: null,
      message: 'Materialized views refreshed successfully',
    };
  }
}
