import { WashSetup } from 'src/types/internal.type';
import { DeviceConfigBase } from './device-config-base';

/**
 * Configuration handler for car wash devices.
 *
 * This class handles the configuration of wash stations that provide various cleaning services
 * such as high-pressure water, foam, air drying, wax application, and other wash-related services.
 *
 * @example
 * ```typescript
 * // Example usage with raw device payload
 * const rawWashData = {
 *   hp_water: 30,        // 30 seconds of high-pressure water
 *   foam: 15,            // 15 seconds of foam application
 *   air: 20,             // 20 seconds of air drying
 *   water: 25,           // 25 seconds of regular water
 *   vacuum: 60,          // 60 seconds of vacuum service
 *   black_tire: 10,      // 10 seconds of tire cleaning
 *   wax: 5,              // 5 seconds of wax application
 *   air_conditioner: 15, // 15 seconds of air freshener
 *   parking_fee: 0,      // No parking fee penalty
 *   promotion: 10,       // 10% discount promotion
 *   on_time: "06:00",    // Opens at 6 AM
 *   off_time: "22:00",   // Closes at 10 PM
 *   coin: true,          // Accepts coins
 *   promptpay: true,     // Accepts PromptPay
 *   bank_note: false     // Does not accept bank notes
 * };
 *
 * const washConfig = new DeviceWashConfig(rawWashData);
 *
 * // Access structured configuration
 * console.log('Operating Hours:', washConfig.configs?.system.on_time, '-', washConfig.configs?.system.off_time);
 * console.log('HP Water Service:', washConfig.configs?.sale.hp_water.description,
 *             washConfig.configs?.sale.hp_water.value, washConfig.configs?.sale.hp_water.unit);
 * console.log('Payment Methods:', washConfig.configs?.system.payment_method);
 * ```
 *
 * @example
 * ```typescript
 * // Example in service usage
 * export class DeviceService {
 *   configureWashDevice(deviceId: string, rawData: any) {
 *     const washConfig = new DeviceWashConfig(rawData);
 *
 *     // Use the structured configuration for API response
 *     return {
 *       deviceId,
 *       config: washConfig.configs,
 *       services: Object.keys(washConfig.configs?.sale || {}),
 *       isOperating: this.isWithinOperatingHours(washConfig.configs?.system)
 *     };
 *   }
 * }
 * ```
 */
export class DeviceWashConfig extends DeviceConfigBase<WashSetup> {
  /**
   * Creates a new wash device configuration.
   *
   * @param payload - Raw configuration data from the wash device containing:
   *   - Service durations (in seconds) for each wash service
   *   - System settings (operating hours, payment methods)
   */
  constructor(payload: {
    hp_water: number;
    foam: number;
    air: number;
    water: number;
    vacuum: number;
    black_tire: number;
    wax: number;
    air_conditioner: number;
    parking_fee: number;
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
   * Parses raw wash service data into structured configuration with Thai descriptions.
   *
   * Converts numeric service durations into standardized Parameter objects containing:
   * - value: Duration in seconds
   * - unit: "วินาที" (seconds in Thai)
   * - description: Thai description of the service
   *
   * @protected Implements abstract method from DeviceConfigBase
   * @returns Structured wash setup configuration with all service parameters
   */
  protected parseSaleConfig(): WashSetup {
    return {
      hp_water: {
        value: this.payload.hp_water,
        unit: 'วินาที',
        description: 'ปริมาณน้ำ',
      },
      foam: {
        value: this.payload.foam,
        unit: 'วินาที',
        description: 'โฟม',
      },
      air: {
        value: this.payload.air,
        unit: 'วินาที',
        description: 'ลม',
      },
      water: {
        value: this.payload.water,
        unit: 'วินาที',
        description: 'น้ำยาปรับอากาศ',
      },
      vacuum: {
        value: this.payload.vacuum,
        unit: 'วินาที',
        description: 'ดูดฝุ่น',
      },
      black_tire: {
        value: this.payload.black_tire,
        unit: 'วินาที',
        description: 'ล้างล้อ',
      },
      wax: {
        value: this.payload.wax,
        unit: 'วินาที',
        description: 'ลง wax',
      },
      air_conditioner: {
        value: this.payload.air_conditioner,
        unit: 'วินาที',
        description: 'ปรับอากาศ',
      },
      parking_fee: {
        value: this.payload.parking_fee,
        unit: 'วินาที',
        description: 'ค่าปรับที่จอดรถ',
      },
      promotion: {
        value: this.payload.promotion,
        unit: '(%) เปอร์เซ็นต์',
        description: 'โปรโมชั่น',
      },
    };
  }
}
