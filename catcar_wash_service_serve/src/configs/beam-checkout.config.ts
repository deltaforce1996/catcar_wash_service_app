import { registerAs } from '@nestjs/config';

export const beamCheckoutConfig = registerAs('beamCheckout', () => ({
  apiUrl: process.env.BEAM_API_URL || 'https://playground.api.beamcheckout.com',
  merchantId: process.env.BEAM_MERCHANT_ID,
  secretKey: process.env.BEAM_SECRET_KEY,
  webhookUrl: process.env.BEAM_WEBHOOK_URL,
  webhookHmacKey: process.env.BEAM_WEBHOOK_HMAC_KEY || 'KOFELguf5L1ltuDlkDHGUkPPnQhrgYYijTR4Fqh7APc=',
}));
