import { Module } from '@nestjs/common';
import { PaymentGatewayController } from './payment-gateway.controller';
import { PaymentGatewayService } from './payment-gateway.service';
import { BeamCheckoutService } from 'src/services/beam-checkout.service';
import { ErrorLoggerService } from 'src/services';

@Module({
  controllers: [PaymentGatewayController],
  providers: [PaymentGatewayService, BeamCheckoutService, ErrorLoggerService],
  exports: [PaymentGatewayService],
})
export class PaymentGatewayModule {}
