import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: process.env.PORT ?? 3000,
  environment: process.env.NODE_ENV,
  apiPrefix: process.env.API_PREFIX,
  version: process.env.VERSION,
  logLevel: process.env.LOG_LEVEL,
}));
