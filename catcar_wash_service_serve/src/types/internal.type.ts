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

type Parameter = { value: number; unit: string };

export type MicrowaveSetup = {
  hp_water: Parameter;
  foam: Parameter;
  air: Parameter;
  water: Parameter;
  vacuum: Parameter;
  black_tire: Parameter;
  wax: Parameter;
  air_conditioner: Parameter;
  parking_fee: Parameter;
  promotion: Parameter;
};

export type WrapCarSetup = {
  blow_dust: Parameter;
  sterilize: Parameter;
  uv: Parameter;
  ozone: Parameter;
  drying: Parameter;
  perfume: Parameter;
  start_service_fee: Parameter;
  promotion: Parameter;
};

export type GlobalSetup = {
  on_time: string;
  off_time: string;
  payment_method: {
    coin: boolean;
    promptpay: boolean;
    bank_note: boolean;
  };
};

export type DeviceInfo = {
  mac_address: string;
  firmware_version: string;
};

export type DeviceState = {
  timestamp: number;
  rssi: number;
  uptime: number;
  status: 'normal' | 'error';
};
