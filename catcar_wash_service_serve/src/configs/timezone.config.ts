import { registerAs } from '@nestjs/config';

export default registerAs('timezone', () => ({
  /**
   * Application timezone name (IANA timezone identifier)
   * Default: 'Asia/Bangkok' for Thailand
   * Can be overridden via TIMEZONE environment variable
   */
  name: process.env.TIMEZONE ?? 'Asia/Bangkok',

  /**
   * Timezone offset in hours from UTC
   * Bangkok is UTC+7
   */
  offsetHours: 7,

  /**
   * Timezone offset in milliseconds
   * Used for JavaScript Date calculations
   */
  get offsetMs(): number {
    return this.offsetHours * 60 * 60 * 1000;
  },
}));
