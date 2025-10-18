import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Device Signature Guard
 * ตรวจสอบ x-signature header จาก device requests
 * ตาม PLAN-COMUNICATION.md:
 *
 * SECRET_KEY = modernchabackdoor
 * x-signature: SHA256( payload (raw JSON bytes) + SECRET_KEY)
 *
 * Example:
 * payload = {"device_id":"device-0004","amount":100,"payment_method":"QR_PROMPT_PAY","description":"Car wash payment"}
 * signature = SHA256(payload_string + "modernchabackdoor")
 */
@Injectable()
export class DeviceSignatureGuard implements CanActivate {
  private readonly logger = new Logger(DeviceSignatureGuard.name);
  private readonly SECRET_KEY = 'modernchabackdoor';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-signature'] as string;
    const method = request.method;
    const url = request.url;

    // Log request attempt
    this.logger.log(`Device request - Method: ${method}, URL: ${url}, Signature: ${signature ? 'Present' : 'Missing'}`);

    if (!signature) {
      this.logger.warn('Device signature missing');
      throw new UnauthorizedException('Device signature (x-signature header) is required');
    }

    try {
      // Get request payload
      // For POST/PUT/PATCH: use body
      // For GET/DELETE: use empty object (as per PLAN-COMUNICATION.md)
      let payload = {};
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        payload = request.body || {};
      }
      // For GET/DELETE: payload is empty object {}

      // Verify signature
      const isValid = this.verifyDeviceSignature(payload, signature);

      if (!isValid) {
        this.logger.warn('Device signature verification failed');
        this.logger.debug(`Expected signature for payload: ${JSON.stringify(payload)}`);
        throw new UnauthorizedException('Invalid device signature');
      }

      this.logger.log(`Device signature verified successfully for ${method} ${url}`);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Device signature verification error', error);
      throw new UnauthorizedException('Device signature verification failed');
    }
  }

  /**
   * Verify device signature
   * SHA256(payload_string + SECRET_KEY)
   *
   * Important: JSON.stringify must NOT sort keys to match Python's json.dumps()
   * Python: json.dumps(payload, separators=(',', ':'))
   * JavaScript: JSON.stringify(payload) - no key sorting
   */
  private verifyDeviceSignature(payload: any, signature: string): boolean {
    try {
      // Convert payload to JSON string (no whitespace, preserving key order)
      // Match Python's json.dumps(payload, separators=(',', ':'))
      const payloadString = JSON.stringify(payload);

      // Calculate expected signature: SHA256(payload + SECRET_KEY)
      const combined = payloadString + this.SECRET_KEY;
      const computedSignature = crypto.createHash('sha256').update(combined, 'utf8').digest('hex');

      this.logger.debug(`Payload string: ${payloadString}`);
      this.logger.debug(`Combined: ${combined}`);
      this.logger.debug(`Computed signature: ${computedSignature}`);
      this.logger.debug(`Received signature: ${signature}`);

      // Compare signatures (case-insensitive for hex strings)
      const isVerified = computedSignature.toLowerCase() === signature.toLowerCase();

      if (!isVerified) {
        this.logger.warn('Signature mismatch');
        this.logger.warn(`Expected: ${computedSignature}`);
        this.logger.warn(`Received: ${signature}`);
      }

      return isVerified;
    } catch (error) {
      this.logger.error('Error during device signature verification', error);
      return false;
    }
  }
}
