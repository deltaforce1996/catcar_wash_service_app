import { Injectable, Logger } from '@nestjs/common';
import {
  BeamCheckoutService,
  ChargeData,
  ChargeResult,
  ChargeStatus,
  RefundData,
  RefundResult,
} from 'src/services/beam-checkout.service';
import { CreatePaymentDto, CreateRefundDto } from './dtos';
import { PaymentApiStatus, Prisma, tbl_payment_temps } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { BadRequestException, ItemNotFoundException } from 'src/errors';
import {
  BeamWebhookPayloadUnion,
  BeamWebhookEventType,
  BeamChargeSucceededPayload,
  BeamPaymentMethodType,
} from 'src/types';
import { MqttCommandManagerService } from 'src/services/adepters/mqtt-command-manager.service';

type PaymentInfoByDevice = Prisma.tbl_usersGetPayload<{
  select: { id: true; payment_info: true };
}>;

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  constructor(
    private readonly beamCheckoutService: BeamCheckoutService,
    private readonly prisma: PrismaService,
    private readonly mqttCommandManagerService: MqttCommandManagerService,
  ) {}

  /**
   * Rollback external service operations only
   * Database operations are automatically rolled back by Prisma transaction
   */
  private async rollbackExternalServices(chargeResult: ChargeResult | null, originalError: any): Promise<void> {
    this.logger.warn('Starting external service rollback for failed payment creation', originalError?.message);

    try {
      // Only handle external service cleanup (Beam Checkout charges)
      if (chargeResult?.chargeId) {
        try {
          // Note: Beam Checkout might not have a cancel API, but we log it for manual cleanup
          this.logger.warn(
            `External Service Rollback: Charge created in Beam Checkout with ID: ${chargeResult.chargeId} - Manual cleanup may be required`,
          );

          // If Beam Checkout has a cancel API, uncomment and implement:
          // await this.beamCheckoutService.cancelCharge(chargeResult.chargeId);
          // this.logger.log(`External Service Rollback: Cancelled charge in Beam Checkout with ID: ${chargeResult.chargeId}`);
        } catch (beamError) {
          this.logger.error('Failed to cancel charge in Beam Checkout during rollback', beamError);
        }
      } else {
        this.logger.log('External Service Rollback: No external service cleanup required (no charge created)');
      }

      await Promise.resolve(); // Ensure async method has await
      this.logger.log('External service rollback completed successfully');
    } catch (rollbackError) {
      this.logger.error('Failed to complete external service rollback', rollbackError);
      // Don't throw here to avoid masking the original error
    }
  }

  /**
   * Create payment with timeout protection
   * Wraps the main createPayment method with timeout handling
   */
  private async createPaymentWithTimeout(
    createPaymentDto: CreatePaymentDto,
    timeoutMs: number = 30000, // 30 seconds default timeout
  ): Promise<any> {
    return Promise.race([
      this.createPayment(createPaymentDto),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Payment creation timeout'));
        }, timeoutMs);
      }),
    ]);
  }

  /**
   * Check for duplicate payment attempts
   * Prevents creating duplicate payments with the same reference_id
   */
  private async checkDuplicatePayment(referenceId: string, deviceId: string): Promise<boolean> {
    const existingPayment = await this.prisma.tbl_payment_temps.findFirst({
      where: {
        reference_id: referenceId,
        device_id: deviceId,
        status: {
          in: ['PENDING', 'SUCCEEDED'],
        },
      },
    });

    return !!existingPayment;
  }

  private async getPaymentInfo(user_id: string): Promise<PaymentInfoByDevice> {
    const paymentInfo: PaymentInfoByDevice | null = await this.prisma.tbl_users.findUnique({
      where: { id: user_id },
      select: { id: true, payment_info: true },
    });
    if (!paymentInfo) {
      throw new BadRequestException('Payment info not found');
    }
    if (!paymentInfo.payment_info) {
      throw new BadRequestException('Payment info not found');
    }

    const paymentInfoData = paymentInfo.payment_info as any;
    if (!paymentInfoData.merchant_id || !paymentInfoData.api_key || !paymentInfoData.HMAC_key) {
      throw new BadRequestException('Merchant ID or API Key or HMAC Key is missing in payment configuration');
    }
    return paymentInfo;
  }

  /**
   * สร้างการชำระเงินใหม่
   * TODO: เพิ่มการบันทึกข้อมูลลง database
   * TODO: เพิ่มการตรวจสอบ device และ user permissions
   * TODO: เพิ่มการ validate ข้อมูลก่อนสร้าง charge
   */
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<tbl_payment_temps> {
    let chargeResult: ChargeResult | null = null;

    try {
      this.logger.log(`Creating payment for device: ${createPaymentDto.device_id}, amount: ${createPaymentDto.amount}`);

      // ใช้ database transaction เพื่อให้สามารถ rollback ได้
      return await this.prisma.$transaction(
        async (tx) => {
          // TODO: ตรวจสอบว่า device มีอยู่จริงหรือไม่
          const device = await tx.tbl_devices.findUnique({
            where: { id: createPaymentDto.device_id },
            select: { owner_id: true },
          });
          if (!device) {
            throw new ItemNotFoundException('Device not found');
          }

          const paymentInfo: PaymentInfoByDevice = await this.getPaymentInfo(device.owner_id);

          // สร้าง reference_id ชั่วคราว
          const referenceId = createPaymentDto.reference_id || this.generateReferenceId();

          // // ตรวจสอบ duplicate payment
          // if (createPaymentDto.reference_id) {
          //   const isDuplicate = await this.checkDuplicatePayment(referenceId, createPaymentDto.device_id);
          //   if (isDuplicate) {
          //     throw new BadRequestException('Payment with this reference ID already exists');
          //   }
          // }

          // สร้าง payment record ใน database
          const paymentTemp: tbl_payment_temps = await tx.tbl_payment_temps.create({
            data: {
              device_id: createPaymentDto.device_id,
              amount: Number(createPaymentDto.amount / 100),
              payment_method: createPaymentDto.payment_method || 'QR_PROMPT_PAY',
              reference_id: referenceId,
              status: 'PENDING',
            },
          });

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
              paymentMethodType: createPaymentDto.payment_method as BeamPaymentMethodType,
              ...(createPaymentDto.payment_method === 'QR_PROMPT_PAY' && {
                qrPromptPay: {
                  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
                },
              }),
            },
            returnUrl: createPaymentDto.callback_url,
          };

          // สร้าง charge ผ่าน Beam Checkout
          chargeResult = await this.beamCheckoutService.createCharge(chargeData);

          // อัปเดต payment record ด้วย transaction_id และ return ข้อมูลที่อัปเดตแล้ว
          const updatedPaymentTemp = await tx.tbl_payment_temps.update({
            where: { id: paymentTemp.id },
            data: {
              payment_results: {
                ...chargeResult,
              },
            },
          });

          // await this.mqttCommandManagerService.sendPaymentStatus(chargeResult.chargeId, 'PENDING');

          setTimeout(() => {
            if (chargeResult) {
              this.mqttCommandManagerService
                .sendPaymentStatus(chargeResult.chargeId, 'SUCCEEDED')
                .catch((err) => this.logger.error('Failed to send payment status', err));
            }
          }, 6000);

          this.logger.log(`Payment created successfully with charge ID: ${chargeResult.chargeId}`);

          return updatedPaymentTemp;
        },
        {
          timeout: 30000, // 30 seconds timeout
          maxWait: 5000, // 5 seconds max wait time
          isolationLevel: 'ReadCommitted',
        },
      );
    } catch (error) {
      // Rollback operations (only for external services, database is already rolled back by transaction)
      await this.rollbackExternalServices(chargeResult, error);

      // Determine appropriate error message based on error type
      let errorMessage = 'Failed to create payment';
      if (error instanceof ItemNotFoundException) {
        errorMessage = error.message;
      } else if (error instanceof BadRequestException) {
        errorMessage = error.message;
      } else if (error?.message?.includes('authentication')) {
        errorMessage = 'Payment service authentication failed';
      } else if (error?.message?.includes('network') || error?.code === 'ECONNREFUSED') {
        errorMessage = 'Payment service temporarily unavailable';
      }

      throw new BadRequestException(errorMessage);
    }
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
  ): Promise<{ message: string }> {
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
  private async handleChargeSucceeded(payload: BeamChargeSucceededPayload): Promise<{ message: string }> {
    this.logger.log(`Processing charge succeeded: ${payload.chargeId}`);

    // TODO: อัปเดตสถานะใน database
    await this.prisma.tbl_payment_temps.updateMany({
      where: {
        reference_id: payload.referenceId,
      },
      data: {
        status: payload.status,
      },
    });

    await this.mqttCommandManagerService.sendPaymentStatus(payload.chargeId, payload.status);

    return {
      message: 'Charge succeeded webhook processed successfully',
    };
  }

  /**
   * Manual status check for a specific payment
   * This method allows manual checking of payment status and updates the database
   */
  async getPaymentStatus(chargeId: string): Promise<{
    chargeId: string;
    status: string;
  }> {
    this.logger.log(`Performing manual status check for charge: ${chargeId}`);

    // หา payment ที่มี chargeId นี้ใน payment_results
    const payment = await this.prisma.tbl_payment_temps.findFirst({
      where: {
        payment_results: {
          path: ['chargeId'],
          equals: chargeId,
        },
      },
      include: {
        device: {
          select: { id: true, owner_id: true },
        },
      },
    });

    if (!payment) {
      throw new ItemNotFoundException('Payment not found for this charge ID');
    }

    // ดึงข้อมูล payment info สำหรับ authentication
    const paymentInfo = await this.getPaymentInfo(payment.device.owner_id);
    const paymentInfoData = paymentInfo.payment_info as any;

    // Authenticate Beam Checkout service
    this.beamCheckoutService.authenticate({
      merchantId: paymentInfoData.merchant_id as string,
      secretKey: paymentInfoData.api_key as string,
    });

    // ตรวจสอบสถานะจาก Beam Checkout
    const chargeStatus: ChargeStatus = await this.beamCheckoutService.getChargeStatus(chargeId);
    this.logger.debug(`Charge status: ${JSON.stringify(chargeStatus, null, 2)}`);

    // อัปเดตสถานะใน database โดยใช้ chargeId
    await this.prisma.tbl_payment_temps.updateMany({
      where: {
        payment_results: {
          path: ['chargeId'],
          equals: chargeId,
        },
      },
      data: {
        status: this.mapBeamStatusToPayment(chargeStatus.status) as any,
      },
    });

    this.logger.log(
      `Payment status updated for charge ${chargeId}: ${payment.status} -> ${this.mapBeamStatusToPayment(chargeStatus.status)}`,
    );

    return {
      chargeId: chargeId,
      status: this.mapBeamStatusToPayment(chargeStatus.status),
    };
  }

  /**
   * Map Beam Checkout status to internal payment status
   */
  private mapBeamStatusToPayment(beamStatus: string): string {
    switch (beamStatus) {
      case 'PENDING':
        return 'PENDING';
      case 'SUCCEEDED':
        return 'SUCCEEDED';
      case 'FAILED':
        return 'FAILED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Create a refund for a successful payment and return the complete refund status
   */
  async createRefund(createRefundDto: CreateRefundDto): Promise<RefundResult> {
    this.logger.log(`Creating refund for charge: ${createRefundDto.chargeId}`);

    try {
      // Find the payment record by chargeId
      const payment = await this.prisma.tbl_payment_temps.findFirst({
        where: {
          payment_results: {
            path: ['chargeId'],
            equals: createRefundDto.chargeId,
          },
        },
        include: {
          device: {
            select: { id: true, owner_id: true },
          },
        },
      });

      if (!payment) {
        throw new ItemNotFoundException('Payment not found for this charge ID');
      }

      if (payment.status !== 'SUCCEEDED') {
        throw new BadRequestException('Only successful payments can be refunded');
      }

      // Get payment info for authentication
      const paymentInfo = await this.getPaymentInfo(payment.device.owner_id);
      const paymentInfoData = paymentInfo.payment_info as any;

      // Authenticate Beam Checkout service
      this.beamCheckoutService.authenticate({
        merchantId: paymentInfoData.merchant_id as string,
        secretKey: paymentInfoData.api_key as string,
      });

      // Create refund through Beam Checkout
      const refundData: RefundData = {
        chargeId: createRefundDto.chargeId,
        reason: createRefundDto.reason,
      };

      const refundResult: { refundId: string; reason: string } =
        await this.beamCheckoutService.createRefund(refundData);

      this.logger.log(`Refund created successfully: ${refundResult.refundId}`);

      // Get complete refund status immediately after creation
      const refundStatus: RefundResult = await this.beamCheckoutService.getRefundStatus(refundResult.refundId);

      await this.prisma.tbl_payment_temps.update({
        where: { id: payment.id },
        data: {
          status: PaymentApiStatus.CANCELLED,
          payment_results: {
            ...(payment.payment_results as any),
            refund: refundStatus,
          },
        },
      });

      this.logger.log(`Refund created and status retrieved: ${refundStatus.status}`);

      return refundStatus;
    } catch (error) {
      this.logger.error('Failed to create refund', error);

      if (error instanceof ItemNotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to create refund');
    }
  }
}
