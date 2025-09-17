import type {
  ApiSuccessResponse,
  EnumDeviceStatus,
  EnumDeviceType,
  EnumSortOrder,
} from "~/types";
import { BaseApiClient } from "../bases/base-api-client";

export interface DeviceResponseApi {
  id: string;
  name: string;
  type: EnumDeviceType;
  status: EnumDeviceStatus;
  information?: unknown;
  configs?: {
    sale?: {
      // WASH device sale configs
      air?: {
        unit: string;
        value: number;
        description: string;
      };
      wax?: {
        unit: string;
        value: number;
        description: string;
      };
      foam?: {
        unit: string;
        value: number;
        description: string;
      };
      water?: {
        unit: string;
        value: number;
        description: string;
      };
      vacuum?: {
        unit: string;
        value: number;
        description: string;
      };
      hp_water?: {
        unit: string;
        value: number;
        description: string;
      };
      black_tire?: {
        unit: string;
        value: number;
        description: string;
      };
      parking_fee?: {
        unit: string;
        value: number;
        description: string;
      };
      air_conditioner?: {
        unit: string;
        value: number;
        description: string;
      };
      // DRYING device sale configs
      uv?: {
        unit: string;
        value: number;
        description: string;
      };
      ozone?: {
        unit: string;
        value: number;
        description: string;
      };
      drying?: {
        unit: string;
        value: number;
        description: string;
      };
      perfume?: {
        unit: string;
        value: number;
        description: string;
      };
      blow_dust?: {
        unit: string;
        value: number;
        description: string;
      };
      sterilize?: {
        unit: string;
        value: number;
        description: string;
      };
      start_service_fee?: {
        unit: string;
        value: number;
        description: string;
      };
      // Common sale configs
      promotion?: {
        unit: string;
        value: number;
        description: string;
      };
      [key: string]: {
        unit: string;
        value: number;
        description: string;
      } | undefined;
    };
    system?: {
      on_time?: string;
      off_time?: string;
      payment_method?: {
        coin?: boolean;
        bank_note?: boolean;
        promptpay?: boolean;
      };
    };
  };
  created_at?: string;
  updated_at?: string;
  owner?: {
    id: string;
    fullname: string;
    email: string;
  };
  registered_by?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SearchDevicesRequest {
  query?: string;
  page?: number;
  limit?: number;
  sort_by?:
    | "created_at"
    | "updated_at"
    | "name"
    | "type"
    | "status"
    | "register_at";
  sort_order?: EnumSortOrder;
  exclude_all_ref_table?: boolean;
}

export interface CreateDevicePayload {
  name: string;
  type: EnumDeviceType;
  owner_id: string;
  register_by: string;
  information?: unknown;
  configs?: unknown;
}

export interface UpdateDeviceBasicPayload {
  name?: string;
}

export interface UpdateDeviceConfigsPayload {
  configs?: {
    system?: {
      on_time?: string;
      off_time?: string;
      payment_method?: {
        coin?: boolean;
        promptpay?: boolean;
        bank_note?: boolean;
      };
    };
    sale?: {
      [key: string]: number;
    };
  };
}

export interface SetDeviceStatePayload {
  status: EnumDeviceStatus;
}

export class DeviceApiService extends BaseApiClient {
  async SearchDevices(
    payload: SearchDevicesRequest
  ): Promise<ApiSuccessResponse<DeviceResponseApi[]>> {
    const response = await this.get<ApiSuccessResponse<DeviceResponseApi[]>>(
      "api/v1/devices/search",
      {
        params: {
          ...payload,
        },
      }
    );
    return response;
  }

  async GetDeviceById(id: string): Promise<ApiSuccessResponse<DeviceResponseApi>> {
    const response = await this.get<ApiSuccessResponse<DeviceResponseApi>>(
      `api/v1/devices/find-by-id/${id}`
    );
    return response;
  }

  async CreateDevice(
    payload: CreateDevicePayload
  ): Promise<ApiSuccessResponse<DeviceResponseApi>> {
    const response = await this.post<ApiSuccessResponse<DeviceResponseApi>>(
      "api/v1/devices/create",
      payload
    );
    return response;
  }

  async UpdateDeviceBasicById(
    id: string,
    payload: UpdateDeviceBasicPayload
  ): Promise<ApiSuccessResponse<DeviceResponseApi>> {
    const response = await this.put<ApiSuccessResponse<DeviceResponseApi>>(
      `api/v1/devices/update-by-id-basic/${id}`,
      payload
    );
    return response;
  }

  async UpdateDeviceConfigsById(
    id: string,
    payload: UpdateDeviceConfigsPayload
  ): Promise<ApiSuccessResponse<DeviceResponseApi>> {
    const response = await this.put<ApiSuccessResponse<DeviceResponseApi>>(
      `api/v1/devices/update-configs/${id}`,
      payload
    );
    return response;
  }

  async SetDeviceStatus(
    id: string,
    payload: SetDeviceStatePayload
  ): Promise<ApiSuccessResponse<null>> {
    const response = await this.put<ApiSuccessResponse<null>>(
      `api/v1/devices/set-status/${id}`,
      payload
    );
    return response;
  }
}
