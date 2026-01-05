import { Global, Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { MqttLoggerService } from '../../services/mqtt-logger.service';
import { MqttCommandManagerService } from '../../services/adepters/mqtt-command-manager.service';

@Global()
@Module({
  providers: [MqttService, MqttLoggerService, MqttCommandManagerService],
  exports: [MqttService, MqttCommandManagerService],
})
export class MqttModule {}
