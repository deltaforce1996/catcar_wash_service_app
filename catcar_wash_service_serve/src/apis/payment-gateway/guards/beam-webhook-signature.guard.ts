import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class BeamWebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(BeamWebhookSignatureGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private async getWebhookHmacKey(referenceId: string): Promise<string> {
    const payment = await this.prisma.$queryRaw<{ webhook_hmac_key: string }[]>`
      SELECT tbl_users.payment_info->>'HMAC_key' as webhook_hmac_key
      FROM tbl_payment_temps
      INNER JOIN tbl_devices ON tbl_payment_temps.device_id = tbl_devices.id
      INNER JOIN tbl_users ON tbl_devices.owner_id = tbl_users.id
      WHERE reference_id = ${referenceId} LIMIT 1
    `;
    if (!payment[0].webhook_hmac_key) {
      throw new UnauthorizedException('Webhook HMAC key not found');
    }
    return payment[0].webhook_hmac_key;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-beam-signature'] as string;
    const eventType = request.headers['x-beam-event'] as string;

    this.logger.log(`Webhook received - Event: ${eventType}, Signature: ${signature ? 'Present' : 'Missing'}`);

    // Get raw body for signature verification
    const rawBody = request.body;
    if (!rawBody) {
      this.logger.warn('Webhook body is empty');
      throw new UnauthorizedException('Webhook body is required');
    }

    const referenceId = rawBody.referenceId as string;
    const webhookHmacKey = await this.getWebhookHmacKey(referenceId);

    // Log webhook attempt
    this.logger.log(`Webhook received - Event: ${eventType}, Signature: ${signature ? 'Present' : 'Missing'}`);

    if (!signature) {
      this.logger.warn('Webhook signature missing');
      throw new UnauthorizedException('Webhook signature is required');
    }

    if (!eventType) {
      this.logger.warn('Webhook event type missing');
      throw new UnauthorizedException('Webhook event type is required');
    }

    // Validate event type
    const validEventTypes = ['charge.succeeded'];
    if (!validEventTypes.includes(eventType)) {
      this.logger.warn(`Invalid webhook event type: ${eventType}`);
      throw new UnauthorizedException(`Invalid webhook event type: ${eventType}`);
    }

    if (!webhookHmacKey) {
      this.logger.error('Webhook HMAC key not configured');
      throw new UnauthorizedException('Webhook authentication not configured');
    }

    try {
      // Verify signature
      const isValid = this.verifyWebhookSignature(rawBody, signature, webhookHmacKey);

      if (!isValid) {
        this.logger.warn('Webhook signature verification failed');
        throw new UnauthorizedException('Invalid webhook signature');
      }

      this.logger.log(`Webhook signature verified successfully for event: ${eventType}`);
      return true;
    } catch (error) {
      this.logger.error('Webhook signature verification error', error);
      throw new UnauthorizedException('Webhook signature verification failed');
    }
  }

  private verifyWebhookSignature(payload: any, signature: string, hmacKey: string): boolean {
    try {
      // Convert payload to JSON string if it's an object
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      // Decode the base64-encoded HMAC key
      const decodedHmacKey = Buffer.from(hmacKey, 'base64');
      // Create HMAC-SHA256 hash
      const hmac = crypto.createHmac('sha256', decodedHmacKey);
      hmac.update(payloadString, 'utf8');
      const computedSignature = hmac.digest('base64');
      // Compare signatures using timing-safe comparison
      const isVerified = crypto.timingSafeEqual(
        Buffer.from(signature, 'base64'),
        Buffer.from(computedSignature, 'base64'),
      );
      return isVerified;
    } catch (error) {
      this.logger.error('Error during signature verification', error);
      return false;
    }
  }
}
