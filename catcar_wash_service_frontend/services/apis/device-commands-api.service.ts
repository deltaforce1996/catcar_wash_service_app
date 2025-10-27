import type { ApiSuccessResponse } from "~/types";
import { BaseApiClient } from "../bases/base-api-client";

// ==================== Machine Config Types ====================

export interface MachineConfig {
  ACTIVE: boolean;
  BANKNOTE: boolean;
  COIN: boolean;
  QR: boolean;
  ON_TIME: string;
  OFF_TIME: string;
  SAVE_STATE: boolean;
}

export interface FunctionSecPerBaht {
  HP_WATER: number;
  FOAM: number;
  AIR: number;
  WATER: number;
  VACUUM: number;
  BLACK_TIRE: number;
  WAX: number;
  AIR_FRESHENER: number;
  PARKING_FEE: number;
}

export interface FunctionConfig {
  sec_per_baht: FunctionSecPerBaht;
}

export interface PricingConfig {
  BASE_FEE: number;
  PROMOTION: number;
  WORK_PERIOD: number;
}

export interface FunctionStartEnd {
  DUST_BLOW: number;
  SANITIZE: number;
  UV: number;
  OZONE: number;
  DRY_BLOW: number;
  PERFUME: number;
}

// ==================== Request Payload Types ====================

export interface ApplyConfigPayload {
  machine: MachineConfig;
  function?: FunctionConfig;
  pricing?: PricingConfig;
  function_start?: FunctionStartEnd;
  function_end?: FunctionStartEnd;
}

export interface RestartDevicePayload {
  delay_seconds?: number;
}

export interface UpdateFirmwarePayload {
  url: string;
  version: string;
  sha256: string;
  size: number;
  reboot_after: boolean;
}

export interface SendCustomCommandPayload {
  command: string;
  payload: unknown;
  require_ack?: boolean;
}

export interface ManualPaymentPayload {
  amount: number;
}

// ==================== MQTT Command Response Types ====================

export interface CommandConfig {
  config_applied?: ApplyConfigPayload;
  timestamp?: number;
}

export interface FirmwarePayload {
  version: string;
  download_started?: boolean;
  estimated_time?: number;
}

export interface ManualPaymentResponse {
  amount: number;
  expire_at?: number;
}

export interface MqttCommandAckResponse<T = unknown> {
  command_id: string;
  device_id: string;
  command: string;
  status: "SENT" | "SUCCESS" | "FAILED" | "TIMEOUT" | "ERROR" | "PROGRESS";
  timestamp: number;
  results?: T;
  error?: string | null;
}

// ==================== Device Commands API Service ====================

export class DeviceCommandsApiService extends BaseApiClient {
  /**
   * Apply configuration to device
   * POST /api/v1/device-commands/:deviceId/apply-config
   * Note: Config is loaded from database on the backend
   */
  async applyConfig(
    deviceId: string
  ): Promise<ApiSuccessResponse<MqttCommandAckResponse<CommandConfig>>> {
    const response = await this.post<
      ApiSuccessResponse<MqttCommandAckResponse<CommandConfig>>
    >(`api/v1/device-commands/${deviceId}/apply-config`);
    return response;
  }

  /**
   * Restart device
   * POST /api/v1/device-commands/:deviceId/restart
   */
  async restartDevice(
    deviceId: string,
    payload: RestartDevicePayload = { delay_seconds: 5 }
  ): Promise<ApiSuccessResponse<MqttCommandAckResponse<unknown>>> {
    const response = await this.post<
      ApiSuccessResponse<MqttCommandAckResponse<unknown>>
    >(`api/v1/device-commands/${deviceId}/restart`, payload);
    return response;
  }

  /**
   * Update firmware
   * POST /api/v1/device-commands/:deviceId/update-firmware
   * Note: Firmware info is fetched from static URL on the backend
   */
  async updateFirmware(
    deviceId: string
  ): Promise<ApiSuccessResponse<MqttCommandAckResponse<FirmwarePayload>>> {
    const response = await this.post<
      ApiSuccessResponse<MqttCommandAckResponse<FirmwarePayload>>
    >(`api/v1/device-commands/${deviceId}/update-firmware`);
    return response;
  }

  /**
   * Reset configuration
   * POST /api/v1/device-commands/:deviceId/reset-config
   */
  async resetConfig(
    deviceId: string
  ): Promise<ApiSuccessResponse<MqttCommandAckResponse<CommandConfig>>> {
    const response = await this.post<
      ApiSuccessResponse<MqttCommandAckResponse<CommandConfig>>
    >(`api/v1/device-commands/${deviceId}/reset-config`);
    return response;
  }

  /**
   * Send custom command
   * POST /api/v1/device-commands/:deviceId/custom
   */
  async sendCustomCommand(
    deviceId: string,
    payload: SendCustomCommandPayload
  ): Promise<ApiSuccessResponse<MqttCommandAckResponse<unknown>>> {
    const response = await this.post<
      ApiSuccessResponse<MqttCommandAckResponse<unknown>>
    >(`api/v1/device-commands/${deviceId}/custom`, payload);
    return response;
  }

  /**
   * Send manual payment
   * POST /api/v1/device-commands/:deviceId/manual-payment
   */
  async sendManualPayment(
    deviceId: string,
    payload: ManualPaymentPayload
  ): Promise<
    ApiSuccessResponse<MqttCommandAckResponse<ManualPaymentResponse>>
  > {
    const response = await this.post<
      ApiSuccessResponse<MqttCommandAckResponse<ManualPaymentResponse>>
    >(`api/v1/device-commands/${deviceId}/manual-payment`, payload);
    return response;
  }
}
