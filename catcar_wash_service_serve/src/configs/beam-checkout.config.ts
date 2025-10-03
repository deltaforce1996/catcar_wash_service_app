import { registerAs } from '@nestjs/config';

export const beamCheckoutConfig = registerAs('beamCheckout', () => ({
  apiUrl: process.env.BEAM_API_URL || 'https://playground.api.beamcheckout.com',
}));
