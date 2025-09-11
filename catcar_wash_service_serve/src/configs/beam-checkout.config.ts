import { registerAs } from '@nestjs/config';

export const beamCheckoutConfig = registerAs('beamCheckout', () => ({
  apiUrl: process.env.BEAM_API_URL || 'https://api.beamcheckout.com',
  clientId: process.env.BEAM_CLIENT_ID,
  clientSecret: process.env.BEAM_CLIENT_SECRET,
  webhookUrl: process.env.BEAM_WEBHOOK_URL,
  webhookSecret: process.env.BEAM_WEBHOOK_SECRET,
  timeout: parseInt(process.env.BEAM_TIMEOUT || '30000', 10),
  retryAttempts: parseInt(process.env.BEAM_RETRY_ATTEMPTS || '3', 10),
  retryDelay: parseInt(process.env.BEAM_RETRY_DELAY || '1000', 10),
}));
