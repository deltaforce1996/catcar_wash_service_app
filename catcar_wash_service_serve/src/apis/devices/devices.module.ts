import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import {
  ErrorLoggerService,
  DeviceRegistrationService,
  EventManagerService,
  DeviceRegistrationEventAdapter,
} from 'src/services';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule],
  providers: [
    DevicesService,
    ErrorLoggerService,
    DeviceRegistrationService,
    EventManagerService,
    DeviceRegistrationEventAdapter,
  ],
  controllers: [DevicesController],
  exports: [DevicesService, DeviceRegistrationService, EventManagerService, DeviceRegistrationEventAdapter],
})
export class DevicesModule {}
