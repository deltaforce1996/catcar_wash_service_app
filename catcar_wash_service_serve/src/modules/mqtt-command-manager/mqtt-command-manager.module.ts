import { Module } from '@nestjs/common';
import { MqttCommandManagerService } from './mqtt-command-manager.service';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
  imports: [MqttModule],
  providers: [MqttCommandManagerService],
  exports: [MqttCommandManagerService],
})
export class MqttCommandManagerModule {}
