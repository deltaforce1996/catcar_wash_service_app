import type {
  ApiSuccessResponse,
  EnumDeviceStatus,
  EnumDeviceType,
  EnumSortOrder,
} from "~/types";
import { BaseApiClient } from "../bases/base-api-client";

interface DeviceInformationResponseApi {
  description: string;
  mac_address: string;
  chip_id: string;
  model: string;
  firmware_version: string;
}

export interface DeviceResponseApi {
  id: string;
  name: string;
  type: EnumDeviceType;
  status: EnumDeviceStatus;
  information?: DeviceInformationResponseApi;
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
      [key: string]:
        | {
            unit: string;
            value: number;
            description: string;
          }
        | undefined;
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
  last_state: {
    state_data: {
      rssi: number;
      status: "NORMAL" | "ERROR" | "OFFLINE";
      uptime: number;
      timestamp: number;
      datetime: string;
    };
  };
}

export interface SearchDevicesRequest {
  query?: {
    search?: string; // search device id, device name, and owner fullname fields
    type?: EnumDeviceType; // WASH or DRYING
    status?: EnumDeviceStatus; // DEPLOYED or DISABLED
    owner?: string; // owner id
  };
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
  exclude_all_ref_table?: boolean; // true if need full response false if need only device (For select device only)
}

export interface CreateDevicePayload {
  name: string;
  type: EnumDeviceType;
  owner_id: string;
  register_by: string;
  information?: {
    description: string;
    mac_address: string;
    chip_id: string;
    model: string;
    firmware_version: string;
  };
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
      [config_name: string]: number;
    };
  };
}

export interface SetDeviceStatePayload {
  status: EnumDeviceStatus;
}

export class DeviceApiService extends BaseApiClient {
  private convertQueryToParams(query: SearchDevicesRequest["query"]): string {
    if (!query) return "";

    const parts: string[] = [];
    for (const [key, value] of Object.entries(query)) {
      if (
        value != null &&
        value !== "" &&
        value.trim().toUpperCase() !== "ALL"
      ) {
        parts.push(`${key}: {${value}}`);
      }
    }
    return parts.join(" ");
  }
  async SearchDevices(
    payload: SearchDevicesRequest
  ): Promise<ApiSuccessResponse<DeviceResponseApi[]>> {
    const response = await this.get<ApiSuccessResponse<DeviceResponseApi[]>>(
      "api/v1/devices/search",
      {
        params: {
          query: this.convertQueryToParams(payload.query),
          page: payload.page,
          limit: payload.limit,
          sort_by: payload.sort_by,
          sort_order: payload.sort_order,
          exclude_all_ref_table: payload.exclude_all_ref_table,
        },
      }
    );
    return response;
  }

  async GetDeviceById(
    id: string
  ): Promise<ApiSuccessResponse<DeviceResponseApi>> {
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
