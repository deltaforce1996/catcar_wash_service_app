import { Module } from '@nestjs/common';
import { DeviceCommandsController } from './device-commands.controller';
import { DeviceCommandsService } from './device-commands.service';
import { MqttCommandManagerService } from '../../services/adepters/mqtt-command-manager.service';
import { ErrorLoggerService } from 'src/services';
import { FirmwaresModule } from '../firmwares/firmwares.module';

@Module({
  imports: [FirmwaresModule],
  controllers: [DeviceCommandsController],
  providers: [DeviceCommandsService, MqttCommandManagerService, ErrorLoggerService],
  exports: [DeviceCommandsService],
})
export class DeviceCommandsModule {}
