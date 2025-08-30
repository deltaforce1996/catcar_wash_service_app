import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ErrorLoggerService } from 'src/services';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, ErrorLoggerService],
  exports: [DashboardService],
})
export class DashboardModule {}
