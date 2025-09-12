import { Controller, Post, Get, Put, Delete, Body, Param, UseFilters, UseGuards, Request } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { PaymentCallbackDto } from './dtos/payment-callback.dto';
import { AllExceptionFilter } from 'src/common';
import { SuccessResponse } from 'src/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from 'src/types/internal.type';

@UseFilters(AllExceptionFilter)
@UseGuards(JwtAuthGuard)
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
      data: result.data,
      message: result.message,
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
   * จัดการ payment callback จาก payment gateway
   * PUT /api/v1/payment-gateway/payments/:id/callback
   */
  @Put('payments/:id/callback')
  async handlePaymentCallback(
    @Param('id') paymentId: string,
    @Body() callbackDto: PaymentCallbackDto,
  ): Promise<SuccessResponse<any>> {
    const result = await this.paymentGatewayService.handlePaymentCallback(paymentId, callbackDto);
    return {
      success: true,
      data: result.data,
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
