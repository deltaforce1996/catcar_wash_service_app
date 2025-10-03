import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { ErrorLoggerService } from 'src/services';

@Module({
  providers: [DevicesService, ErrorLoggerService],
  controllers: [DevicesController],
  exports: [DevicesService],
})
export class DevicesModule {}
