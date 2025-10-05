import { DryingSetup, ParameterPricing } from 'src/types/internal.type';
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
 *   configs: {
 *     machine: {
 *       ACTIVE: true,              // Device is active
 *       BANKNOTE: true,            // Accepts bank notes
 *       COIN: true,                // Accepts coins
 *       QR: true,                  // Accepts QR payment (PromptPay)
 *       ON_TIME: "07:00",          // Opens at 7 AM
 *       OFF_TIME: "21:00",         // Closes at 9 PM
 *       SAVE_STATE: true           // Save device state
 *     },
 *     pricing: {
 *       BASE_FEE: 20,              // 20 baht base service fee
 *       PROMOTION: 15,             // 15% discount promotion
 *       WORK_PERIOD: 120           // 120 seconds work period
 *     },
 *     function_start: {
 *       DUST_BLOW: 5,              // 5 seconds dust blowing at start
 *       SANITIZE: 10,              // 10 seconds sanitization at start
 *       UV: 8,                     // 8 seconds UV treatment at start
 *       OZONE: 7,                  // 7 seconds ozone cleaning at start
 *       DRY_BLOW: 15,              // 15 seconds air drying at start
 *       PERFUME: 3                 // 3 seconds perfume at start
 *     },
 *     function_end: {
 *       DUST_BLOW: 10,             // 10 seconds dust blowing at end
 *       SANITIZE: 15,              // 15 seconds sanitization at end
 *       UV: 12,                    // 12 seconds UV treatment at end
 *       OZONE: 10,                 // 10 seconds ozone cleaning at end
 *       DRY_BLOW: 20,              // 20 seconds air drying at end
 *       PERFUME: 5                 // 5 seconds perfume at end
 *     }
 *   }
 * };
 *
 * const dryingConfig = new DeviceDryingConfig(rawDryingData);
 *
 * // Access structured configuration
 * console.log('Base Fee:', dryingConfig.configs?.sale.base_fee.value,
 *             dryingConfig.configs?.sale.base_fee.unit);
 * console.log('UV Treatment:', dryingConfig.configs?.sale.uv.description,
 *             'Start:', dryingConfig.configs?.sale.uv.start,
 *             'End:', dryingConfig.configs?.sale.uv.end,
 *             dryingConfig.configs?.sale.uv.unit);
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
        BASE_FEE: number;
        PROMOTION: number;
        WORK_PERIOD: number;
      };
      function_start: {
        DUST_BLOW: number;
        SANITIZE: number;
        UV: number;
        OZONE: number;
        DRY_BLOW: number;
        PERFUME: number;
      };
      function_end: {
        DUST_BLOW: number;
        SANITIZE: number;
        UV: number;
        OZONE: number;
        DRY_BLOW: number;
        PERFUME: number;
      };
    };
  }) {
    // Spread machine config at root level and include the entire configs structure
    super({ ...payload.configs.machine, configs: payload.configs });
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
        start: this.payload.configs.function_start.DUST_BLOW,
        end: this.payload.configs.function_end.DUST_BLOW,
        unit: 'วินาที',
        description: 'เป่าแห้ง',
      },
      sterilize: {
        start: this.payload.configs.function_start.SANITIZE,
        end: this.payload.configs.function_end.SANITIZE,
        unit: 'วินาที',
        description: 'ฆ่าเชื้อ',
      },
      uv: {
        start: this.payload.configs.function_start.UV,
        end: this.payload.configs.function_end.UV,
        unit: 'วินาที',
        description: 'UV',
      },
      ozone: {
        start: this.payload.configs.function_start.OZONE,
        end: this.payload.configs.function_end.OZONE,
        unit: 'วินาที',
        description: 'Ozone',
      },
      drying: {
        start: this.payload.configs.function_start.DRY_BLOW,
        end: this.payload.configs.function_end.DRY_BLOW,
        unit: 'วินาที',
        description: 'เป่าแห้ง',
      },
      perfume: {
        start: this.payload.configs.function_start.PERFUME,
        end: this.payload.configs.function_end.PERFUME,
        unit: 'วินาที',
        description: 'น้ำหอม',
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
      base_fee: {
        value: this.payload.configs.pricing.BASE_FEE,
        unit: 'บาท',
        description: 'ค่าบริการเริ่มต้น',
      },
      work_period: {
        value: this.payload.configs.pricing.WORK_PERIOD,
        unit: 'วินาที',
        description: 'ระยะเวลาการทำงาน',
      },
    };
  }
}
