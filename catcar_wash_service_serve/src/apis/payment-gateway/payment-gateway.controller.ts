import { Controller, Post, Get, Delete, Body, Param, UseFilters, Request, UseGuards, Headers } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { AllExceptionFilter } from 'src/common';
import { SuccessResponse } from 'src/types';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from 'src/types/internal.type';
import { BeamWebhookSignatureGuard } from './guards/beam-webhook-signature.guard';
import type { BeamWebhookPayloadUnion, BeamWebhookEventType } from 'src/types';

@UseFilters(AllExceptionFilter)
// @UseGuards(JwtAuthGuard)
@Controller('api/v1/payment-gateway')
export class PaymentGatewayController {
  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}

  /**
   * สร้างการชำระเงินใหม่
   * POST /api/v1/payment-gateway/payments
   */
  @Post('payments')
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req: Request & { user: AuthenticatedUser },
  ): Promise<SuccessResponse<any>> {
    const result = await this.paymentGatewayService.createPayment(createPaymentDto, req.user);
    return {
      success: true,
      data: result,
      message: 'Payment created successfully',
    };
  }

  /**
   * ตรวจสอบสถานะการชำระเงิน
   * GET /api/v1/payment-gateway/payments/:id/status
   */
  @Get('payments/:id/status')
  async getPaymentStatus(
    @Param('id') paymentId: string,
    @Request() req: Request & { user: AuthenticatedUser },
  ): Promise<SuccessResponse<any>> {
    const result = await this.paymentGatewayService.getPaymentStatus(paymentId, req.user);
    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  }
  /**
   * จัดการ Beam webhook callbacks
   * POST /api/v1/payment-gateway/webhook
   */
  @Post('webhook')
  @UseGuards(BeamWebhookSignatureGuard)
  async handleBeamWebhook(
    @Body() webhookPayload: BeamWebhookPayloadUnion,
    @Headers('x-beam-event') eventType: BeamWebhookEventType,
  ): Promise<SuccessResponse<any>> {
    const result = await this.paymentGatewayService.handleBeamWebhook(webhookPayload, eventType);
    return {
      success: true,
      message: result.message,
    };
  }

  /**
   * ยกเลิกการชำระเงิน
   * DELETE /api/v1/payment-gateway/payments/:id
   */
  @Delete('payments/:id')
  async cancelPayment(
    @Param('id') paymentId: string,
    @Request() req: Request & { user: AuthenticatedUser },
  ): Promise<SuccessResponse<any>> {
    const result = await this.paymentGatewayService.cancelPayment(paymentId, req.user);
    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  }
}
