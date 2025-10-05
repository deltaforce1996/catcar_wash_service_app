import { ParameterPricing, WashSetup } from 'src/types/internal.type';
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
 *   configs: {
 *     machine: {
 *       ACTIVE: true,           // Device is active
 *       BANKNOTE: false,        // Does not accept bank notes
 *       COIN: true,             // Accepts coins
 *       QR: true,               // Accepts QR payment
 *       ON_TIME: "06:00",       // Opens at 6 AM
 *       OFF_TIME: "22:00",      // Closes at 10 PM
 *       SAVE_STATE: true        // Saves device state
 *     },
 *     pricing: {
 *       PROMOTION: 10           // 10% discount promotion
 *     },
 *     function: {
 *       sec_per_baht: {
 *         HP_WATER: 30,         // 30 seconds of high-pressure water per baht
 *         FOAM: 15,             // 15 seconds of foam application per baht
 *         AIR: 20,              // 20 seconds of air drying per baht
 *         WATER: 25,            // 25 seconds of regular water per baht
 *         VACUUM: 60,           // 60 seconds of vacuum service per baht
 *         BLACK_TIRE: 10,       // 10 seconds of tire cleaning per baht
 *         WAX: 5,               // 5 seconds of wax application per baht
 *         AIR_FRESHENER: 15,    // 15 seconds of air freshener per baht
 *         PARKING_FEE: 0        // No parking fee penalty
 *       }
 *     }
 *   }
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
    configs: {
      machine: {
        ACTIVE: boolean;
        BANKNOTE: boolean;
        COIN: boolean;
        QR: boolean;
        ON_TIME: string;
        OFF_TIME: string;
        SAVE_STATE: boolean;
      };
      pricing: {
        PROMOTION: number;
      };
      function: {
        sec_per_baht: {
          HP_WATER: number;
          FOAM: number;
          AIR: number;
          WATER: number;
          VACUUM: number;
          BLACK_TIRE: number;
          WAX: number;
          AIR_FRESHENER: number;
          PARKING_FEE: number;
        };
      };
    };
  }) {
    // Spread machine config at root level and include the entire configs structure
    super({ ...payload.configs.machine, configs: payload.configs });
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
        value: this.payload.configs.function.sec_per_baht.HP_WATER,
        unit: 'วินาที',
        description: 'ปริมาณน้ำ',
      },
      foam: {
        value: this.payload.configs.function.sec_per_baht.FOAM,
        unit: 'วินาที',
        description: 'โฟม',
      },
      air: {
        value: this.payload.configs.function.sec_per_baht.AIR,
        unit: 'วินาที',
        description: 'ลม',
      },
      water: {
        value: this.payload.configs.function.sec_per_baht.WATER,
        unit: 'วินาที',
        description: 'น้ำยาปรับอากาศ',
      },
      vacuum: {
        value: this.payload.configs.function.sec_per_baht.VACUUM,
        unit: 'วินาที',
        description: 'ดูดฝุ่น',
      },
      black_tire: {
        value: this.payload.configs.function.sec_per_baht.BLACK_TIRE,
        unit: 'วินาที',
        description: 'ล้างล้อ',
      },
      wax: {
        value: this.payload.configs.function.sec_per_baht.WAX,
        unit: 'วินาที',
        description: 'ลง wax',
      },
      air_conditioner: {
        value: this.payload.configs.function.sec_per_baht.AIR_FRESHENER,
        unit: 'วินาที',
        description: 'ปรับอากาศ',
      },
      parking_fee: {
        value: this.payload.configs.function.sec_per_baht.PARKING_FEE,
        unit: 'วินาที',
        description: 'ค่าปรับที่จอดรถ',
      },
    };
  }

  protected parsePricingConfig(): Record<string, ParameterPricing> {
    return {
      promotion: {
        value: this.payload.configs.pricing.PROMOTION,
        unit: '(%) เปอร์เซ็นต์',
        description: 'โปรโมชั่น',
      },
    };
  }
}
