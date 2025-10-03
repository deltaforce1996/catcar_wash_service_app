import { DryingSetup } from 'src/types/internal.type';
import { DeviceConfigBase } from './device-config-base';

/**
 * Configuration handler for car drying and detailing devices.
 *
 * This class handles the configuration of drying stations that provide post-wash services
 * such as air drying, sterilization, UV treatment, ozone cleaning, and fragrance application.
 *
 * @example
 * ```typescript
 * // Example usage with raw device payload
 * const rawDryingData = {
 *   blow_dust: 20,           // 20 seconds of dust blowing
 *   sterilize: 30,           // 30 seconds of sterilization
 *   uv: 15,                  // 15 seconds of UV treatment
 *   ozone: 10,               // 10 seconds of ozone cleaning
 *   drying: 45,              // 45 seconds of air drying
 *   perfume: 5,              // 5 seconds of perfume application
 *   start_service_fee: 20,   // 20 baht starting service fee
 *   promotion: 15,           // 15% discount promotion
 *   on_time: "07:00",        // Opens at 7 AM
 *   off_time: "21:00",       // Closes at 9 PM
 *   coin: true,              // Accepts coins
 *   promptpay: true,         // Accepts PromptPay
 *   bank_note: true          // Accepts bank notes
 * };
 *
 * const dryingConfig = new DeviceDryingConfig(rawDryingData);
 *
 * // Access structured configuration
 * console.log('Service Fee:', dryingConfig.configs?.sale.start_service_fee.value,
 *             dryingConfig.configs?.sale.start_service_fee.unit);
 * console.log('UV Treatment:', dryingConfig.configs?.sale.uv.description,
 *             dryingConfig.configs?.sale.uv.value, dryingConfig.configs?.sale.uv.unit);
 * ```
 *
 * @example
 * ```typescript
 * // Example API endpoint usage
 * @Get('drying-device/:id/config')
 * async getDryingConfig(@Param('id') deviceId: string) {
 *   const rawConfig = await this.deviceRepository.findConfig(deviceId);
 *   const dryingConfig = new DeviceDryingConfig(rawConfig);
 *
 *   return {
 *     success: true,
 *     data: {
 *       deviceId,
 *       systemConfig: dryingConfig.configs?.system,
 *       serviceConfig: dryingConfig.configs?.sale,
 *       availableServices: Object.keys(dryingConfig.configs?.sale || {})
 *     }
 *   };
 * }
 * ```
 */
export class DeviceDryingConfig extends DeviceConfigBase<DryingSetup> {
  /**
   * Creates a new drying device configuration.
   *
   * @param payload - Raw configuration data from the drying device containing:
   *   - Service durations (in seconds) for each drying/detailing service
   *   - Service fees (in baht) for paid services
   *   - System settings (operating hours, payment methods)
   */
  constructor(payload: {
    blow_dust: number;
    sterilize: number;
    uv: number;
    ozone: number;
    drying: number;
    perfume: number;
    start_service_fee: number;
    promotion: number;
    on_time: string;
    off_time: string;
    coin: boolean;
    promptpay: boolean;
    bank_note: boolean;
  }) {
    super(payload);
  }

  /**
   * Parses raw drying service data into structured configuration with Thai descriptions.
   *
   * Converts numeric service durations and fees into standardized Parameter objects containing:
   * - value: Duration in seconds or fee amount in baht
   * - unit: "วินาที" (seconds) or "บาท" (baht) in Thai
   * - description: Thai description of the service
   *
   * Note: Most services are time-based except start_service_fee which is fee-based.
   *
   * @protected Implements abstract method from DeviceConfigBase
   * @returns Structured drying setup configuration with all service parameters
   */
  protected parseSaleConfig(): DryingSetup {
    return {
      blow_dust: {
        value: this.payload.blow_dust,
        unit: 'วินาที',
        description: 'เป่าฝุ่น',
      },
      sterilize: {
        value: this.payload.sterilize,
        unit: 'วินาที',
        description: 'ฆ่าเชื้อ',
      },
      uv: {
        value: this.payload.uv,
        unit: 'วินาที',
        description: 'UV',
      },
      ozone: {
        value: this.payload.ozone,
        unit: 'วินาที',
        description: 'Ozone',
      },
      drying: {
        value: this.payload.drying,
        unit: 'วินาที',
        description: 'เป่าแห้ง',
      },
      perfume: {
        value: this.payload.perfume,
        unit: 'วินาที',
        description: 'น้ำหอม',
      },
      start_service_fee: {
        value: this.payload.start_service_fee,
        unit: 'บาท',
        description: 'ค่าบริการเริ่มต้น',
      },
      promotion: {
        value: this.payload.promotion,
        unit: '(%) เปอร์เซ็นต์',
        description: 'โปรโมชั่น',
      },
    };
  }
}
