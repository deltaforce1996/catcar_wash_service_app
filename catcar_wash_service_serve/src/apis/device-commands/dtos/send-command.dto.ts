import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsObject, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for applying configuration to device
 */
export class MachineConfigDto {
  @IsBoolean()
  ACTIVE: boolean;

  @IsBoolean()
  BANKNOTE: boolean;

  @IsBoolean()
  COIN: boolean;

  @IsBoolean()
  QR: boolean;

  @IsString()
  ON_TIME: string;

  @IsString()
  OFF_TIME: string;

  @IsBoolean()
  SAVE_STATE: boolean;
}

export class FunctionSecPerBahtDto {
  @IsNumber()
  HP_WATER: number;

  @IsNumber()
  FOAM: number;

  @IsNumber()
  AIR: number;

  @IsNumber()
  WATER: number;

  @IsNumber()
  VACUUM: number;

  @IsNumber()
  BLACK_TIRE: number;

  @IsNumber()
  WAX: number;

  @IsNumber()
  AIR_FRESHENER: number;

  @IsNumber()
  PARKING_FEE: number;
}

export class FunctionConfigDto {
  @ValidateNested()
  @Type(() => FunctionSecPerBahtDto)
  sec_per_baht: FunctionSecPerBahtDto;
}

export class PricingConfigDto {
  @IsNumber()
  BASE_FEE: number;

  @IsNumber()
  PROMOTION: number;

  @IsNumber()
  WORK_PERIOD: number;
}

export class FunctionStartEndDto {
  @IsNumber()
  DUST_BLOW: number;

  @IsNumber()
  SANITIZE: number;

  @IsNumber()
  UV: number;

  @IsNumber()
  OZONE: number;

  @IsNumber()
  DRY_BLOW: number;

  @IsNumber()
  PERFUME: number;
}

export class ApplyConfigDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MachineConfigDto)
  machine: MachineConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FunctionConfigDto)
  function?: FunctionConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PricingConfigDto)
  pricing?: PricingConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FunctionStartEndDto)
  function_start?: FunctionStartEndDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FunctionStartEndDto)
  function_end?: FunctionStartEndDto;
}

/**
 * DTO for restarting device
 */
export class RestartDeviceDto {
  @IsOptional()
  @IsNumber()
  delay_seconds?: number = 5;
}

/**
 * DTO for sending custom command
 */
export class SendCustomCommandDto {
  @IsString()
  @IsNotEmpty()
  command: string;

  @IsObject()
  payload: any;

  @IsOptional()
  @IsBoolean()
  require_ack?: boolean = true;
}

/**'
 * DTO for sending manual payment
 */
export class ManualPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
