import { registerAs } from '@nestjs/config';

export default registerAs('device', () => ({
  // Device ACK timeout in seconds (how long to wait for device to respond)
  ackTimeoutSeconds: parseInt(process.env.DEVICE_ACK_TIMEOUT_SECONDS ?? '15', 10),
}));
