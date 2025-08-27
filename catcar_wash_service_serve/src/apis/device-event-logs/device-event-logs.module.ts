import { Module } from '@nestjs/common';
import { DeviceEventLogsService } from './device-event-logs.service';
import { DeviceEventLogsController } from './device-event-logs.controller';

@Module({
  providers: [DeviceEventLogsService],
  controllers: [DeviceEventLogsController],
  exports: [DeviceEventLogsService],
})
export class DeviceEventLogsModule {}
