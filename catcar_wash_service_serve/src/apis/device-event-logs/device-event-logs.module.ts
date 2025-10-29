import { Module } from '@nestjs/common';
import { DeviceEventLogsController } from './device-event-logs.controller';
import { ErrorLoggerService, SqlScriptService, EventManagerService, DeviceEventLogsService } from 'src/services';
import { DeviceEventLogsEventAdapter } from 'src/services/adepters/device-event-logs-event.adapter';

@Module({
  providers: [
    DeviceEventLogsService,
    ErrorLoggerService,
    SqlScriptService,
    EventManagerService,
    DeviceEventLogsEventAdapter,
  ],
  controllers: [DeviceEventLogsController],
  exports: [DeviceEventLogsService, DeviceEventLogsEventAdapter],
})
export class DeviceEventLogsModule {}
