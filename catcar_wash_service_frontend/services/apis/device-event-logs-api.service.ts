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
      net_amount?: number;
      chargeId?: string;
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

export interface PaginatedDeviceEventLogsResponse {
  items: DeviceEventLogResponseApi[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchDeviceEventLogsRequest {
  query?: {
    user_id?: string;
    device_id?: string; // Dashboard not implement device_id
    device_type?: EnumDeviceType;
    payment_status?: EnumPaymentStatus;
    payload_timestamp?: string; // timestamp or start-end range
    search?: string; // Search device_id, device_name fields
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
  async SearchDeviceEventLogs(
    payload: SearchDeviceEventLogsRequest
  ): Promise<ApiSuccessResponse<PaginatedDeviceEventLogsResponse>> {
    const response = await this.get<
      ApiSuccessResponse<PaginatedDeviceEventLogsResponse>
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
