import type {
  ApiSuccessResponse,
  EnumDeviceType,
  EnumEventType,
  EnumPaymentStatus,
  EnumSortOrder,
} from "~/types";
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
    bank?: Record<string, number>;
    coin?: Record<string, number>;
    type?: EnumEventType;
    status?: EnumPaymentStatus;
    timestamp?: number;
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
  query?: {
    user_id?: string;
    device_id?: string;
    device_type?: EnumDeviceType;
    payment_status?: EnumPaymentStatus;
    payload_timestamp?: string; // timestamp or start-end range
  };
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "type" | "device_id";
  sort_order?: EnumSortOrder;
}

export class DeviceEventLogsApiService extends BaseApiClient {
  private convertQueryToParams(
    query: SearchDeviceEventLogsRequest["query"]
  ): string {
    if (!query) return "";
    
    const parts: string[] = [];
    for (const [key, value] of Object.entries(query)) {
      if (value != null && value !== "") {
        parts.push(`${key}: {${value}}`);
      }
    }
    return parts.join(" ");
  }
  async SearchDeviceEventLogs(
    payload: SearchDeviceEventLogsRequest
  ): Promise<ApiSuccessResponse<DeviceEventLogResponseApi[]>> {
    const response = await this.get<
      ApiSuccessResponse<DeviceEventLogResponseApi[]>
    >("api/v1/device-event-logs/search", {
      params: {
        query: this.convertQueryToParams(payload.query),
        page: payload.page,
        limit: payload.limit,
        sort_by: payload.sort_by,
        sort_order: payload.sort_order,
      },
    });
    return response;
  }
}
