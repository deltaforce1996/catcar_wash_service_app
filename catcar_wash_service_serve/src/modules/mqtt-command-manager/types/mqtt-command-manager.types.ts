export interface MqttCommandPayload {
  command_id: string;
  command: string;
  require_ack: boolean;
  payload: any;
  timestamp: number;
}

export interface MqttCommandAckResponse {
  command_id: string;
  device_id: string;
  command: string;
  status: 'SUCCESS' | 'FAILED' | 'ERROR' | 'PROGRESS';
  error?: string;
  new_version?: string; // สำหรับ UPDATE_FIRMWARE
  timestamp: number;
}

export interface MqttCommandResult {
  command_id: string;
  device_id: string;
  command: string;
  status: 'SENT' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'ERROR';
  error?: string;
  ack_response?: MqttCommandAckResponse;
  sent_at: Date;
  ack_received_at?: Date;
  timeout_at?: Date;
}

export interface CommandConfig {
  machine: {
    ACTIVE: boolean;
    BANKNOTE: boolean;
    COIN: boolean;
    QR: boolean;
    ON_TIME: string;
    OFF_TIME: string;
    SAVE_STATE: boolean;
  };
  function?: {
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
  pricing?: {
    BASE_FEE: number;
    PROMOTION: number;
    WORK_PERIOD: number;
  };
  function_start?: {
    DUST_BLOW: number;
    SANITIZE: number;
    UV: number;
    OZONE: number;
    DRY_BLOW: number;
    PERFUME: number;
  };
  function_end?: {
    DUST_BLOW: number;
    SANITIZE: number;
    UV: number;
    OZONE: number;
    DRY_BLOW: number;
    PERFUME: number;
  };
}

export interface ApplyConfigPayload {
  configs: CommandConfig;
}

export interface RestartPayload {
  delay_seconds: number;
}

export interface UpdateFirmwarePayload {
  url: string;
  version: string;
  sha256: string;
  size: number;
  reboot_after: boolean;
  timeout_sec: number;
}

export interface ResetConfigPayload {
  delay_seconds: number;
}

export type MqttCommandType = 'APPLY_CONFIG' | 'RESTART' | 'UPDATE_FIRMWARE' | 'RESET_CONFIG';

export interface MqttCommandOptions {
  timeout_ms?: number;
  retry_attempts?: number;
  retry_delay_ms?: number;
}

export interface ActiveCommand {
  command_id: string;
  device_id: string;
  command: string;
  timeout: NodeJS.Timeout;
  resolve: (result: MqttCommandResult) => void;
  reject: (error: Error) => void;
  sent_at: Date;
}
