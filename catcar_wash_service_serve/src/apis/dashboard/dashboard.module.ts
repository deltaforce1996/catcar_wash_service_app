import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DateTimeService, ErrorLoggerService } from 'src/services';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DateTimeService, ErrorLoggerService],
  exports: [DashboardService],
})
export class DashboardModule {}
