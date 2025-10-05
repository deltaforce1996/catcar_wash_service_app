import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { DeviceStateProcessorService } from './device-state-processor.service';

@Module({
  imports: [PrismaModule],
  providers: [DeviceStateProcessorService],
  exports: [DeviceStateProcessorService],
})
export class DeviceStateProcessorModule {}
