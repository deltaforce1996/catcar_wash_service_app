import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { DeviceStateProcessorService } from './device-state-processor.service';
import { MqttService } from 'src/services/mqtt.service';

@Module({
  imports: [PrismaModule],
  providers: [DeviceStateProcessorService, MqttService],
  exports: [DeviceStateProcessorService],
})
export class DeviceStateProcessorModule {}
