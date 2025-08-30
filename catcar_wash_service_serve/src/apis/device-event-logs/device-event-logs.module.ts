import { Module } from '@nestjs/common';
import { DeviceEventLogsService } from './device-event-logs.service';
import { DeviceEventLogsController } from './device-event-logs.controller';
import { ErrorLoggerService } from 'src/services';

@Module({
  providers: [DeviceEventLogsService, ErrorLoggerService],
  controllers: [DeviceEventLogsController],
  exports: [DeviceEventLogsService],
})
export class DeviceEventLogsModule {}
