import { DeviceStatus } from '@prisma/client';
import { IsEnum, IsObject, IsOptional } from 'class-validator';

// System configuration that's common to all device types
export interface SystemConfig {
  on_time?: string;
  off_time?: string;
  payment_method?: {
    coin?: boolean;
    promptpay?: boolean;
    bank_note?: boolean;
  };
}

// Sale parameter for update - supports both formats:
// - WASH devices: number (shorthand) or { value?: number }
// - DRYING devices: { start?: number, end?: number }
export interface SaleParameterUpdateObject {
  value?: number; // For WASH devices (explicit format)
  start?: number; // For DRYING devices
  end?: number; // For DRYING devices
}

// Sale configuration update - flexible for any device type
// WASH: Can use shorthand "hp_water": 15 or object "hp_water": { "value": 15 }
// DRYING: Must use object "uv": { "start": 200, "end": 300 }
export type SaleConfigUpdate = Record<string, number | SaleParameterUpdateObject>;

// Pricing configuration update - send only numeric values
export type PricingConfigUpdate = Record<string, number>;

// Device configuration for updates - generic for all device types
// Sale config can accept:
//   - WASH: "hp_water": 15 or "hp_water": { "value": 15 }
//   - DRYING: "uv": { "start": 200, "end": 300 }
export interface DeviceConfigUpdate {
  system?: SystemConfig;
  sale?: SaleConfigUpdate;
  pricing?: PricingConfigUpdate;
}

export class UpdateDeviceConfigsDto {
  @IsObject()
  @IsOptional()
  configs?: DeviceConfigUpdate;

  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;
}
