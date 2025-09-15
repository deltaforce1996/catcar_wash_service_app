import { Injectable, Logger } from '@nestjs/common';
import { BeamCheckoutService, ChargeData, ChargeResult } from 'src/services/beam-checkout.service';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { AuthenticatedUser } from 'src/types/internal.type';
import { Prisma, tbl_payment_temps } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { BadRequestException, ItemNotFoundException } from 'src/errors';
import {
  BeamWebhookPayloadUnion,
  BeamWebhookEventType,
  BeamChargeSucceededPayload,
  BeamPaymentMethodType,
} from 'src/types';

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
    user?: AuthenticatedUser,
    timeoutMs: number = 30000, // 30 seconds default timeout
  ): Promise<any> {
    return Promise.race([
      this.createPayment(createPaymentDto, user),
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
    return paymentInfo;
  }

  /**
   * สร้างการชำระเงินใหม่
   * TODO: เพิ่มการบันทึกข้อมูลลง database
   * TODO: เพิ่มการตรวจสอบ device และ user permissions
   * TODO: เพิ่มการ validate ข้อมูลก่อนสร้าง charge
   */
  async createPayment(createPaymentDto: CreatePaymentDto, _user?: AuthenticatedUser): Promise<tbl_payment_temps> {
    void _user; // TODO: ใช้ user parameter เมื่อเพิ่ม permission checking

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
          if (!paymentInfo) {
            throw new ItemNotFoundException('Payment info not found');
          }

          // สร้าง reference_id ชั่วคราว
          const referenceId = createPaymentDto.reference_id || this.generateReferenceId();

          // ตรวจสอบ duplicate payment
          if (createPaymentDto.reference_id) {
            const isDuplicate = await this.checkDuplicatePayment(referenceId, createPaymentDto.device_id);
            if (isDuplicate) {
              throw new BadRequestException('Payment with this reference ID already exists');
            }
          }

          // สร้าง payment record ใน database
          const paymentTemp: tbl_payment_temps = await tx.tbl_payment_temps.create({
            data: {
              device_id: createPaymentDto.device_id,
              amount: Number(createPaymentDto.amount / 100).toFixed(2),
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

          this.logger.log(`Payment created successfully with charge ID: ${chargeResult.chargeId}`);

          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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

    return {
      message: 'Charge succeeded webhook processed successfully',
    };
  }
}
