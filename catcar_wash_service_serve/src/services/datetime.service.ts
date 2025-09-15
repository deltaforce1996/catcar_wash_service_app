import { Injectable } from '@nestjs/common';

@Injectable()
export class DateTimeService {
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

    // Convert to Thailand timezone (UTC+7)
    const thailandTime = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);

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
