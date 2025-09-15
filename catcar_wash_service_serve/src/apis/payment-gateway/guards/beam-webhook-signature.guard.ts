import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class BeamWebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(BeamWebhookSignatureGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-beam-signature'];
    const eventType = request.headers['x-beam-event'];

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

    // Get webhook HMAC key from configuration
    const webhookHmacKey = this.configService.get<string>('beamCheckout.webhookHmacKey');
    if (!webhookHmacKey) {
      this.logger.error('Webhook HMAC key not configured');
      throw new UnauthorizedException('Webhook authentication not configured');
    }

    // Get raw body for signature verification
    const rawBody = request.body;
    if (!rawBody) {
      this.logger.warn('Webhook body is empty');
      throw new UnauthorizedException('Webhook body is required');
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
      return crypto.timingSafeEqual(Buffer.from(signature, 'base64'), Buffer.from(computedSignature, 'base64'));
    } catch (error) {
      this.logger.error('Error during signature verification', error);
      return false;
    }
  }
}
