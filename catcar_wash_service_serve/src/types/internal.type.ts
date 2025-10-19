export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  permission: {
    id: string;
    name: string;
  };
  status: 'ACTIVE' | 'INACTIVE';
};

export type JwtPayload = AuthenticatedUser & {
  iat?: number;
  exp?: number;
};

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ParameterPricing = { value: number; unit: string; description: string };
export type ParameterWash = { value: number; unit: string; description: string };
export type ParametersDrying = { start: number; end: number; unit: string; description: string };

export type WashSetup = {
  hp_water: ParameterWash;
  foam: ParameterWash;
  air: ParameterWash;
  water: ParameterWash;
  vacuum: ParameterWash;
  black_tire: ParameterWash;
  wax: ParameterWash;
  air_conditioner: ParameterWash;
  parking_fee: ParameterWash;
} & Record<string, ParameterWash>;

export type DryingSetup = {
  blow_dust: ParametersDrying;
  sterilize: ParametersDrying;
  uv: ParametersDrying;
  ozone: ParametersDrying;
  drying: ParametersDrying;
  perfume: ParametersDrying;
} & Record<string, ParametersDrying>;

export type GlobalSetup = {
  on_time: string;
  off_time: string;
  save_state: boolean;
  payment_method: {
    coin: boolean;
    promptpay: boolean;
    bank_note: boolean;
  };
};

export type DeviceInfo = {
  chip_id: string;
  mac_address: string;
  firmware_version: string;
};

export type DeviceState = {
  timestamp: number;
  rssi: number;
  uptime: number;
  status: 'normal' | 'error';
  date_state?: string;
};
