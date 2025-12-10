import { Module } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { ErrorLoggerService } from 'src/services';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [DevicesModule],
  providers: [PromotionsService, ErrorLoggerService],
  controllers: [PromotionsController],
  exports: [PromotionsService],
})
export class PromotionsModule {}
