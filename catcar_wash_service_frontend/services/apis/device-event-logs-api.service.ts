import type { ApiSuccessResponse, EnumDeviceType, EnumEventType, EnumPaymentStatus, EnumSortOrder } from "~/types";
import { BaseApiClient } from "../bases/base-api-client";

export interface DeviceEventLogResponseApi {
  id: string;
  device_id: string;
  payload: {
    qr?: {
      ref1?: string;
      ref2?: string;
      net_amount?: number;
      transaction_id?: string;
    };
    bank?: {
      "20"?: number;
      "50"?: number;
      "300"?: number;
      "500"?: number;
      "1000"?: number;
    };
    coin?: {
      "1"?: number;
      "2"?: number;
      "5"?: number;
      "10"?: number;
    };
    type?: EnumEventType;
    status?: EnumPaymentStatus;
    timestemp?: number;
    total_amount?: number;
    event_at?: string;
    [key: string]: unknown;
  } | null;
  created_at: string;
  device: {
    id: string;
    name: string;
    type: EnumDeviceType;
    owner: {
      id: string;
      fullname: string;
      email: string;
    };
  };
}

export interface SearchDeviceEventLogsRequest {
  query?: string;
  page?: number;
  limit?: number;
  sort_by?:
    | "created_at"
    | "type"
    | "device_id";
  sort_order?: EnumSortOrder;
}

export class DeviceEventLogsApiService extends BaseApiClient {
  async SearchDeviceEventLogs(
    payload: SearchDeviceEventLogsRequest
  ): Promise<ApiSuccessResponse<DeviceEventLogResponseApi[]>> {
    const response = await this.get<ApiSuccessResponse<DeviceEventLogResponseApi[]>>(
      "api/v1/device-event-logs/search",
      {
        params: {
          ...payload,
        },
      }
    );
    return response;
  }
}
