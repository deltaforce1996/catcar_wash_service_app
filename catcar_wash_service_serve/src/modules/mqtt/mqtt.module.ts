import { Global, Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { MqttLoggerService } from '../../services/mqtt-logger.service';

@Global()
@Module({
  providers: [MqttService, MqttLoggerService],
  exports: [MqttService],
})
export class MqttModule {}
