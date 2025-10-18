import { Module } from '@nestjs/common';
import { PaymentGatewayController } from './payment-gateway.controller';
import { PaymentGatewayService } from './payment-gateway.service';
import { BeamCheckoutService } from 'src/services/beam-checkout.service';
import { ErrorLoggerService, MqttCommandManagerService } from 'src/services';
import { DeviceSignatureGuard, BeamWebhookSignatureGuard } from './guards';

@Module({
  controllers: [PaymentGatewayController],
  providers: [
    PaymentGatewayService,
    BeamCheckoutService,
    ErrorLoggerService,
    MqttCommandManagerService,
    DeviceSignatureGuard,
    BeamWebhookSignatureGuard,
  ],
  exports: [PaymentGatewayService],
})
export class PaymentGatewayModule {}
