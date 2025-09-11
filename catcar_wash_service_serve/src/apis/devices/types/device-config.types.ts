/**
 * Shared types for device configurations
 * This file contains all device configuration interfaces that can be reused across DTOs
 */

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

// WASH device specific sale configuration
export interface WashSaleConfig {
  hp_water?: number;
  foam?: number;
  air?: number;
  water?: number;
  vacuum?: number;
  black_tire?: number;
  wax?: number;
  air_conditioner?: number;
  parking_fee?: number;
  promotion?: number;
}

// DRYING device specific sale configuration
export interface DryingSaleConfig {
  blow_dust?: number;
  sterilize?: number;
  uv?: number;
  ozone?: number;
  drying?: number;
  perfume?: number;
  start_service_fee?: number;
  promotion?: number;
}

// Complete WASH device configuration
export interface WashConfig {
  system?: SystemConfig;
  sale?: WashSaleConfig;
}

// Complete DRYING device configuration
export interface DryingConfig {
  system?: SystemConfig;
  sale?: DryingSaleConfig;
}

// Union type for all device configurations
export type DeviceConfig = WashConfig | DryingConfig;
