import type {
  ApiSuccessResponse,
  EnumDeviceType,
  EnumDeviceStatus,
  EnumSortOrder,
} from "~/types";
import { BaseApiClient } from "../bases/base-api-client";

export interface DeviceStateResponseApi {
  id: string;
  device_id: string;
  state_data: {
    rssi?: number;
    status?: "normal" | "error";
    uptime?: number;
    timestamp?: number;
    datetime?: string;
    [key: string]: unknown;
  };
  hash_state: string;
  created_at: string;
  device: {
    id: string;
    name: string;
    type: EnumDeviceType;
    status: EnumDeviceStatus;
    owner: {
      id: string;
      fullname: string;
      email: string;
    };
  };
}

export interface PaginatedDeviceStatesResponse {
  items: DeviceStateResponseApi[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchDeviceStatesRequest {
  query?: {
    id?: string;
    device_id?: string;
    device_name?: string;
    status?: "normal" | "error";
    payload_timestamp?: string; // timestamp or start-end range
  };
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "device_id";
  sort_order?: EnumSortOrder;
}

export class DeviceStatesApiService extends BaseApiClient {
  private convertQueryToParams(
    query: SearchDeviceStatesRequest["query"]
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

  async SearchDeviceStates(
    payload: SearchDeviceStatesRequest
  ): Promise<ApiSuccessResponse<PaginatedDeviceStatesResponse>> {
    const response = await this.get<
      ApiSuccessResponse<PaginatedDeviceStatesResponse>
    >("api/v1/device-states/search", {
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
