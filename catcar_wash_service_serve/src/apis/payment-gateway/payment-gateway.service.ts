import { Injectable, Logger } from '@nestjs/common';
import { BeamCheckoutService, ChargeData, ChargeResult } from 'src/services/beam-checkout.service';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { AuthenticatedUser } from 'src/types/internal.type';
import { Prisma, tbl_payment_temps } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { BadRequestException, ItemNotFoundException } from 'src/errors';
import { BeamWebhookPayloadUnion, BeamWebhookEventType, BeamChargeSucceededPayload } from 'src/types';

type PaymentInfoByDevice = Prisma.tbl_usersGetPayload<{
  select: { id: true; payment_info: true };
}>;

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  constructor(
    private readonly beamCheckoutService: BeamCheckoutService,
    private readonly prisma: PrismaService,
  ) {}

  private async createPaymentTemp(device_id: string, amount: number, payment_method: string, reference_id: string) {
    const paymentTemp: tbl_payment_temps = await this.prisma.tbl_payment_temps.create({
      data: {
        device_id,
        amount,
        payment_method,
        reference_id,
        status: 'PENDING',
      },
    });
    return paymentTemp;
  }

  private async getPaymentInfo(user_id: string): Promise<PaymentInfoByDevice> {
    const paymentInfo: PaymentInfoByDevice | null = await this.prisma.tbl_users.findUnique({
      where: { id: user_id },
      select: { id: true, payment_info: true },
    });
    if (!paymentInfo) {
      throw new BadRequestException('Payment info not found');
    }
    return paymentInfo;
  }

  /**
   * สร้างการชำระเงินใหม่
   * TODO: เพิ่มการบันทึกข้อมูลลง database
   * TODO: เพิ่มการตรวจสอบ device และ user permissions
   * TODO: เพิ่มการ validate ข้อมูลก่อนสร้าง charge
   */
  async createPayment(createPaymentDto: CreatePaymentDto, _user?: AuthenticatedUser) {
    void _user; // TODO: ใช้ user parameter เมื่อเพิ่ม permission checking
    try {
      this.logger.log(`Creating payment for device: ${createPaymentDto.device_id}, amount: ${createPaymentDto.amount}`);

      // TODO: ตรวจสอบว่า device มีอยู่จริงหรือไม่
      const device = await this.prisma.tbl_devices.findUnique({
        where: { id: createPaymentDto.device_id },
        select: { owner_id: true },
      });
      if (!device) {
        throw new ItemNotFoundException('Device not found');
      }

      const paymentInfo: PaymentInfoByDevice = await this.getPaymentInfo(device.owner_id);
      if (!paymentInfo) {
        throw new ItemNotFoundException('Payment info not found');
      }

      // TODO: ตรวจสอบ permissions ของ user
      // if (user && user.permission?.name === 'USER' && device.owner_id !== user.id) {
      //   throw new BadRequestException('You do not have permission to create payment for this device');
      // }

      // สร้าง reference_id ชั่วคราว
      const referenceId = createPaymentDto.reference_id || this.generateReferenceId();

      // TODO: สร้าง payment record ใน database
      const paymentTemp = await this.createPaymentTemp(
        createPaymentDto.device_id,
        createPaymentDto.amount,
        createPaymentDto.payment_method || 'QR_PROMPT_PAY',
        referenceId,
      );

      if (!paymentTemp) {
        throw new BadRequestException('Failed to create payment temp');
      }

      // ตรวจสอบว่า payment_info มีข้อมูลครบถ้วน
      if (!paymentInfo.payment_info) {
        throw new BadRequestException('Payment information not configured for this device owner');
      }

      const paymentInfoData = paymentInfo.payment_info as any;
      if (!paymentInfoData.merchant_id || !paymentInfoData.api_key) {
        throw new BadRequestException('Merchant ID or API Key is missing in payment configuration');
      }

      // เรียกใช้ Beam Checkout Service
      this.beamCheckoutService.authenticate({
        merchantId: paymentInfoData.merchant_id as string,
        secretKey: paymentInfoData.api_key as string,
      });

      // เตรียมข้อมูลสำหรับสร้าง charge
      const chargeData: ChargeData = {
        amount: createPaymentDto.amount,
        currency: 'THB',
        referenceId: referenceId,
        paymentMethod: {
          paymentMethodType: this.mapPaymentMethodToBeam(createPaymentDto.payment_method || 'QR_PROMPT_PAY'),
          ...(createPaymentDto.payment_method === 'QR_PROMPT_PAY' && {
            qrPromptPay: {
              expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
            },
          }),
        },
        returnUrl: createPaymentDto.callback_url,
      };

      // สร้าง charge ผ่าน Beam Checkout
      const chargeResult: ChargeResult = await this.beamCheckoutService.createCharge(chargeData);

      // TODO: อัปเดต payment record ด้วย transaction_id
      await this.prisma.tbl_payment_temps.update({
        where: { id: paymentTemp.id },
        data: {
          payment_results: {
            ...chargeResult,
          },
        },
      });

      this.logger.log(`Payment created successfully with charge ID: ${chargeResult.chargeId}`);

      return {
        success: true,
        data: {
          charge: chargeResult,
          reference_id: referenceId,
          // TODO: เพิ่ม payment data จาก database
        },
        message: 'Payment created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create payment', error);
      throw new BadRequestException('Failed to create payment');
    }
  }

  /**
   * ตรวจสอบสถานะการชำระเงิน
   * TODO: เพิ่มการดึงข้อมูลจาก database
   * TODO: เพิ่มการอัปเดตสถานะใน database
   */
  async getPaymentStatus(paymentId: string, _user?: AuthenticatedUser) {
    void _user; // TODO: ใช้ user parameter เมื่อเพิ่ม permission checking
    try {
      this.logger.log(`Getting payment status for: ${paymentId}`);

      // TODO: ดึงข้อมูล payment จาก database
      // const payment = await this.prisma.payment.findUnique({
      //   where: { id: paymentId },
      //   include: {
      //     device: {
      //       select: { id: true, name: true, owner_id: true }
      //     }
      //   }
      // });
      // if (!payment) {
      //   throw new NotFoundException('Payment not found');
      // }

      // TODO: ตรวจสอบ permissions
      // if (user && user.permission?.name === 'USER' && payment.device.owner_id !== user.id) {
      //   throw new BadRequestException('You do not have permission to view this payment');
      // }

      // TODO: ถ้ามี transaction_id ให้ตรวจสอบสถานะจาก Beam Checkout
      // if (payment.transaction_id) {
      //   this.beamCheckoutService.authenticate();
      //   const chargeStatus = await this.beamCheckoutService.getChargeStatus(payment.transaction_id);
      //
      //   // อัปเดตสถานะใน database ถ้าเปลี่ยน
      //   if (chargeStatus && this.mapBeamStatusToPayment(chargeStatus.status) !== payment.status) {
      //     await this.prisma.payment.update({
      //       where: { id: paymentId },
      //       data: {
      //         status: this.mapBeamStatusToPayment(chargeStatus.status),
      //         gateway_response: JSON.stringify(chargeStatus),
      //       }
      //     });
      //   }
      // }

      // TODO: เพิ่ม await สำหรับ database operations
      await Promise.resolve(); // Placeholder for future database operations

      return {
        success: true,
        data: {
          // TODO: เพิ่ม payment data จาก database
          message: 'Payment status retrieved successfully',
        },
        message: 'Payment status retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to get payment status', error);
      throw new BadRequestException('Failed to get payment status');
    }
  }
  /**
   * ยกเลิกการชำระเงิน
   * TODO: เพิ่มการอัปเดตสถานะใน database
   */
  async cancelPayment(paymentId: string, _user?: AuthenticatedUser) {
    void _user; // TODO: ใช้ user parameter เมื่อเพิ่ม permission checking
    try {
      this.logger.log(`Cancelling payment: ${paymentId}`);

      // TODO: ดึงข้อมูล payment จาก database
      // const payment = await this.prisma.payment.findUnique({
      //   where: { id: paymentId },
      //   include: {
      //     device: {
      //       select: { owner_id: true }
      //     }
      //   }
      // });
      // if (!payment) {
      //   throw new NotFoundException('Payment not found');
      // }

      // TODO: ตรวจสอบ permissions
      // if (user && user.permission?.name === 'USER' && payment.device.owner_id !== user.id) {
      //   throw new BadRequestException('You do not have permission to cancel this payment');
      // }

      // TODO: ยกเลิก charge ใน Beam Checkout ถ้ามี transaction_id
      // if (payment.transaction_id) {
      //   this.beamCheckoutService.authenticate();
      //   await this.beamCheckoutService.cancelCharge(payment.transaction_id);
      // }

      // TODO: อัปเดตสถานะใน database
      // const updatedPayment = await this.prisma.payment.update({
      //   where: { id: paymentId },
      //   data: {
      //     status: 'CANCELLED'
      //   }
      // });

      // TODO: เพิ่ม await สำหรับ database operations
      await Promise.resolve(); // Placeholder for future database operations

      this.logger.log(`Payment cancelled successfully: ${paymentId}`);

      return {
        success: true,
        data: {
          // TODO: เพิ่ม updated payment data
          message: 'Payment cancelled successfully',
        },
        message: 'Payment cancelled successfully',
      };
    } catch (error) {
      this.logger.error('Failed to cancel payment', error);
      throw new BadRequestException('Failed to cancel payment');
    }
  }

  /**
   * แปลง payment method เป็น Beam Checkout format
   * TODO: ใช้ enum แทน string literals
   */
  private mapPaymentMethodToBeam(
    paymentMethod: string,
  ): 'QR_PROMPT_PAY' | 'CARD' | 'ALIPAY' | 'LINE_PAY' | 'SHOPEE_PAY' | 'TRUE_MONEY' | 'WECHAT_PAY' {
    const mapping: Record<
      string,
      'QR_PROMPT_PAY' | 'CARD' | 'ALIPAY' | 'LINE_PAY' | 'SHOPEE_PAY' | 'TRUE_MONEY' | 'WECHAT_PAY'
    > = {
      QR_PROMPT_PAY: 'QR_PROMPT_PAY',
      CARD: 'CARD',
      ALIPAY: 'ALIPAY',
      LINE_PAY: 'LINE_PAY',
      SHOPEE_PAY: 'SHOPEE_PAY',
      TRUE_MONEY: 'TRUE_MONEY',
      WECHAT_PAY: 'WECHAT_PAY',
    };

    return mapping[paymentMethod] || 'QR_PROMPT_PAY';
  }

  /**
   * แปลง Beam Checkout status เป็น payment status
   * TODO: ใช้ enum แทน string literals
   */
  private mapBeamStatusToPayment(beamStatus: string): string {
    const mapping: Record<string, string> = {
      PENDING: 'PENDING',
      SUCCEEDED: 'SUCCESS',
      FAILED: 'FAILED',
      CANCELLED: 'CANCELLED',
    };

    return mapping[beamStatus] || 'PENDING';
  }

  /**
   * สร้าง reference ID
   */
  private generateReferenceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CCW-${timestamp}-${random}`;
  }

  /**
   * จัดการ Beam webhook callbacks
   */
  async handleBeamWebhook(
    webhookPayload: BeamWebhookPayloadUnion,
    eventType: BeamWebhookEventType,
  ): Promise<{ data: any; message: string }> {
    this.logger.log(`Processing Beam webhook: ${eventType}`);

    try {
      switch (eventType) {
        case 'charge.succeeded':
          return await this.handleChargeSucceeded(webhookPayload);
        default:
          throw new BadRequestException(`Unsupported webhook event type: ${eventType as string}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook ${eventType}:`, error);
      throw error;
    }
  }

  /**
   * จัดการ charge.succeeded webhook
   */
  private async handleChargeSucceeded(payload: BeamChargeSucceededPayload): Promise<{ data: any; message: string }> {
    this.logger.log(`Processing charge succeeded: ${payload.chargeId}`);

    try {
      // Update payment status in database
      const updatedPayment = await this.prisma.tbl_payment_temps.updateMany({
        where: {
          reference_id: payload.referenceId,
        },
        data: {
          status: 'SUCCEEDED',
          updated_at: new Date(),
        },
      });

      this.logger.log(`Updated ${updatedPayment.count} payment records for reference: ${payload.referenceId}`);

      // TODO: Add business logic here (e.g., trigger device activation, send notifications, etc.)

      return {
        data: {
          chargeId: payload.chargeId,
          referenceId: payload.referenceId,
          status: payload.status,
          amount: payload.amount,
          currency: payload.currency,
          updatedRecords: updatedPayment.count,
        },
        message: 'Charge succeeded webhook processed successfully',
      };
    } catch (error) {
      this.logger.error('Error processing charge succeeded webhook:', error);
      throw new BadRequestException('Failed to process charge succeeded webhook');
    }
  }
}
