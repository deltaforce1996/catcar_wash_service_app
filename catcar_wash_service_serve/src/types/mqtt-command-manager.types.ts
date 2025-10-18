export type MqttCommandType = 'APPLY_CONFIG' | 'RESTART' | 'UPDATE_FIRMWARE' | 'RESET_CONFIG' | 'PAYMENT';
export interface MqttCommandPayload<T> {
  command_id: string;
  command: MqttCommandType;
  require_ack: boolean;
  payload: T;
  timestamp: number;
}

export interface MqttCommandAckResponse<T> {
  command_id: string;
  device_id: string;
  command: MqttCommandType;
  status: 'SUCCESS' | 'FAILED' | 'ERROR' | 'PROGRESS' | 'TIMEOUT' | 'SENT';
  results?: T;
  error?: string;
  timestamp: number;
}

export interface FirmwarePayload {
  url: string;
  version: string;
  sha256: string;
  size: number;
  reboot_after: boolean;
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

export interface ActiveCommand {
  command_id: string;
  device_id: string;
  command: string;
  timeout: NodeJS.Timeout;
  resolve: (result: MqttCommandAckResponse<any>) => void;
  reject: (error: Error) => void;
  sent_at: number;
}
