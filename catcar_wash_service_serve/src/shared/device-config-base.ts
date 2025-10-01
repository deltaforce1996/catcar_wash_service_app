import { GlobalSetup, ParameterPricing } from 'src/types/internal.type';

/**
 * Abstract base class for dynamic device configurations in the car wash service system.
 *
 * This class provides a generic structure that can handle different types of device configurations
 * while maintaining consistency across all device types (wash, drying, vacuum, etc.).
 *
 * @template T - The specific device setup type (WashSetup, DryingSetup, etc.)
 *
 * @example
 * ```typescript
 * // Example extending this base class for a new device type
 * export class DeviceVacuumConfig extends DeviceConfigBase<VacuumSetup> {
 *   constructor(payload: VacuumPayload) {
 *     super(payload);
 *   }
 *
 *   protected parseSaleConfig(): VacuumSetup {
 *     return {
 *       suction_power: {
 *         value: this.payload.suction_power,
 *         unit: 'วินาที',
 *         description: 'พลังดูดฝุ่น'
 *       },
 *       // ... other vacuum-specific configurations
 *     };
 *   }
 * }
 * ```
 */
export abstract class DeviceConfigBase<T> {
  /**
   * Parsed device configuration containing both system and sale configurations.
   * - system: Global settings shared across all device types (operating hours, payment methods)
   * - sale: Device-specific service configurations (varies by device type)
   */
  public configs: {
    system: GlobalSetup;
    sale: T;
    pricing: Record<string, ParameterPricing>;
  } | null = null;

  /**
   * Creates a new device configuration instance.
   *
   * @param payload - Raw configuration data from the device containing:
   *   - Global system settings (on_time, off_time, payment methods)
   *   - Device-specific service parameters (varies by implementation)
   */
  constructor(
    protected readonly payload: {
      ACTIVE: boolean;
      BANKNOTE: boolean;
      COIN: boolean;
      QR: boolean;
      ON_TIME: string;
      OFF_TIME: string;
      SAVE_STATE: boolean;
    } & Record<string, any>, // Additional device-specific fields
  ) {
    // Automatically parse the payload upon construction
    this.parsePayload();
  }

  /**
   * Parses the raw payload into structured configuration.
   * This method combines system-wide settings with device-specific configurations.
   *
   * @protected Called automatically in constructor
   */
  protected parsePayload(): void {
    this.configs = {
      system: this.parseSystemConfig(),
      sale: this.parseSaleConfig(),
      pricing: this.parsePricingConfig(),
    };
  }

  /**
   * Parses system-wide configuration settings that are common to all device types.
   * Includes operating hours and payment method configurations.
   *
   * @private Internal method used by parsePayload()
   * @returns Structured global setup configuration
   */
  private parseSystemConfig(): GlobalSetup {
    return {
      on_time: this.payload.ON_TIME ?? '00:00',
      off_time: this.payload.OFF_TIME ?? '23:59',
      save_state: this.payload.SAVE_STATE ?? false,
      payment_method: {
        coin: this.payload.COIN ?? false,
        promptpay: this.payload.QR ?? false,
        bank_note: this.payload.BANKNOTE ?? false,
      },
    };
  }
  /**
   * Abstract method that must be implemented by concrete device classes.
   * Each device type should parse its specific service configurations here.
   *
   * @protected Must be implemented by subclasses
   * @returns Device-specific setup configuration of type T
   *
   * @example
   * ```typescript
   * // In DeviceWashConfig
   * protected parseSaleConfig(): WashSetup {
   *   return {
   *     hp_water: {
   *       value: this.payload.hp_water,
   *       unit: 'วินาที',
   *       description: 'ปริมาณน้ำ'
   *     },
   *     // ... other wash services
   *   };
   * }
   * ```
   */
  protected abstract parseSaleConfig(): T;
  protected abstract parsePricingConfig(): Record<string, ParameterPricing>;
}
