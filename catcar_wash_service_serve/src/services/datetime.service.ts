import { Injectable, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import timezoneConfig from 'src/configs/timezone.config';

@Injectable()
export class DateTimeService {
  constructor(
    @Inject(timezoneConfig.KEY)
    private readonly tzConfig: ConfigType<typeof timezoneConfig>,
  ) {}

  /**
   * Get timezone name for SQL queries
   * @returns Timezone name (e.g., 'Asia/Bangkok')
   */
  getTimezoneName(): string {
    return this.tzConfig.name;
  }

  /**
   * Get timezone offset in milliseconds
   * @returns Offset in milliseconds
   */
  getTimezoneOffsetMs(): number {
    return this.tzConfig.offsetMs;
  }

  /**
   * Convert datetime to Thailand timezone (UTC+7)
   * @param date - Date object or ISO string
   * @returns Formatted datetime string in Thailand timezone (YYYY-MM-DD HH:mm:ss)
   */
  convertToThailandTime(date: Date | string): string | null {
    if (!date) return null;

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return null;
    }

    // Convert to configured timezone using offset from config
    const thailandTime = new Date(dateObj.getTime() + this.tzConfig.offsetMs);

    const year = thailandTime.getUTCFullYear();
    const month = String(thailandTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(thailandTime.getUTCDate()).padStart(2, '0');
    const hours = String(thailandTime.getUTCHours()).padStart(2, '0');
    const minutes = String(thailandTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(thailandTime.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Get current Thailand time
   * @returns Current datetime in Thailand timezone
   */
  getCurrentThailandTime(): string | null {
    return this.convertToThailandTime(new Date());
  }
}
