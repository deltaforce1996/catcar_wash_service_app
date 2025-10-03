import type {
  ApiSuccessResponse,
  EnumDeviceStatus,
  EnumDeviceType,
  EnumPaymentStatus,
} from "~/types";
import { BaseApiClient } from "../bases/base-api-client";

export interface DashboardFilterRequest {
  user_id?: string;
  device_id?: string;    // dashboard not implement device_id
  device_status?: EnumDeviceStatus; // dashboard not implement device_status
  device_type?: EnumDeviceType;
  payment_status?: EnumPaymentStatus;
  date: string; // ISO 8601 format: YYYY-MM-DD
  include_charts?: boolean;
}

export interface ChartDataPoint {
  month?: string;
  day?: string;
  hour?: string;
  amount: number;
}

export interface DashboardPeriodData {
  revenue: number;
  change: number;
  data: ChartDataPoint[] | null;
}

export interface DashboardSummaryResponse {
  monthly: DashboardPeriodData;
  daily: DashboardPeriodData;
  hourly: DashboardPeriodData;
  payment_status: EnumPaymentStatus;
}

export class DashboardApiService extends BaseApiClient {
  async GetDashboardSummary(
    filter: DashboardFilterRequest
  ): Promise<ApiSuccessResponse<DashboardSummaryResponse>> {
    const response = await this.get<
      ApiSuccessResponse<DashboardSummaryResponse>
    >("api/v1/dashboard/summary", {
      params: {
        ...filter,
      },
    });
    return response;
  }
}



