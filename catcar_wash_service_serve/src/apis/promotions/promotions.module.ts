import { Module, forwardRef } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { ErrorLoggerService } from 'src/services';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [forwardRef(() => DevicesModule)],
  providers: [PromotionsService, ErrorLoggerService],
  controllers: [PromotionsController],
  exports: [PromotionsService],
})
export class PromotionsModule {}
