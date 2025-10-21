import { Module } from '@nestjs/common';
import { MqttConsoleController } from './mqtt-console.controller';
import { MqttConsoleService } from './mqtt-console.service';

@Module({
  controllers: [MqttConsoleController],
  providers: [MqttConsoleService],
  exports: [MqttConsoleService],
})
export class MqttConsoleModule {}
