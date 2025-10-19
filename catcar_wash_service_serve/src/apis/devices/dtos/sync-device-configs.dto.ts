import { IsObject } from 'class-validator';

/**
 * DTO for syncing device configurations from device to server
 * Accepts raw payload format (same as startup/shutdown)
 * Supports both WASH and DRYING device types
 */
export class SyncDeviceConfigsDto {
  @IsObject()
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
    // WASH device: มี function.sec_per_baht
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
    // DRYING device: มี function_start, function_end
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
    pricing: {
      PROMOTION?: number;
      BASE_FEE?: number;
      WORK_PERIOD?: number;
    };
  };
}
