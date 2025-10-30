/**
 * Device Utility Functions
 * Helpers for device status, last online formatting, and related operations
 */

/**
 * Threshold for considering a device offline (2 minutes in milliseconds)
 */
export const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000;

/**
 * Extract last timestamp from device item
 * @param item - Device item object
 * @returns Timestamp in milliseconds or null if not available
 */
export function getLastTimestampMs(item: any): number | null {
  const ts = item?.last_state?.state_data?.timestamp;
  if (typeof ts === "number" && Number.isFinite(ts)) return ts;
  const dt = item?.last_state?.state_data?.datetime;
  if (typeof dt === "string") {
    const parsed = Date.parse(dt.replace(/-/g, "/"));
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

/**
 * Format time difference in Thai language
 * @param fromMs - Start timestamp in milliseconds
 * @param toMs - End timestamp in milliseconds
 * @returns Formatted time string (e.g., "5 นาที", "2 ชั่วโมง", "3 วัน")
 */
export function formatTimeAgoTh(fromMs: number, toMs: number): string {
  const diffSec = Math.max(0, Math.floor((toMs - fromMs) / 1000));
  if (diffSec < 60) return `${diffSec} วินาที`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาที`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ชั่วโมง`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} วัน`;
}

/**
 * Check if device is offline
 * @param item - Device item object
 * @returns true if device is offline, false otherwise
 */
export function isOffline(item: any): boolean {
  const now = Date.now();
  const last = getLastTimestampMs(item);
  const status = item?.last_state?.state_data?.status;
  if (status && String(status).toLowerCase() !== "normal") return true;
  if (last == null) return true;
  return now - last > OFFLINE_THRESHOLD_MS;
}

/**
 * Get formatted last online status text with color
 * @param item - Device item object
 * @returns Object with text and color for display
 */
export function getLastOnlineStatus(
  item: any
): { text: string; color: string } {
  const now = Date.now();
  const last = getLastTimestampMs(item);
  const timeAgo = last != null ? formatTimeAgoTh(last, now) : "ไม่ทราบ";
  if (isOffline(item)) {
    return { text: `ออฟไลน์ ไป ${timeAgo} ที่แล้ว`, color: "error" };
  }
  return { text: `ล่าสุด ${timeAgo} ที่แล้ว`, color: "success" };
}
