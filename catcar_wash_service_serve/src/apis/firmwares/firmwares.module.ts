import { Module } from '@nestjs/common';
import { FirmwaresService } from './firmwares.service';
import { FirmwaresController } from './firmwares.controller';
import { ErrorLoggerService } from 'src/services';

@Module({
  providers: [FirmwaresService, ErrorLoggerService],
  controllers: [FirmwaresController],
  exports: [FirmwaresService],
})
export class FirmwaresModule {}
