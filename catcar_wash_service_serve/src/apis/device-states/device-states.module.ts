import { Module } from '@nestjs/common';
import { DeviceStatesController } from './device-states.controller';
import { DeviceStatesService } from './device-states.service';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { ErrorLoggerService } from 'src/services/error-logger.service';

@Module({
  imports: [PrismaModule],
  controllers: [DeviceStatesController],
  providers: [DeviceStatesService, ErrorLoggerService],
  exports: [DeviceStatesService],
})
export class DeviceStatesModule {}
