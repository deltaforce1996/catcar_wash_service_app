import type { ApiSuccessResponse, EnumEmpStatus, EnumSortOrder } from "~/types";
import { BaseApiClient } from "../bases/base-api-client";


export interface EmpResponseApi {
  id: string;
  name: string;
  email: string;
  phone: string;
  line: string;
  address: string;
  status: EnumEmpStatus;
  created_at?: string;
  updated_at?: string;
  permission: { id: string; name: string };
}

export interface SearchEmpsRequest {
  query?: string;
  page?: number;
  limit?: number;
  sort_by?:
    | "created_at"
    | "updated_at"
    | "name"
    | "email"
    | "phone"
    | "line"
    | "address"
    | "status"
    | "permission";
  sort_order?: EnumSortOrder;
}

export interface UpdateEmpPayload {
  email?: string;
  name?: string;
  phone?: string;
  line?: string;
  address?: string;
  status?: EnumEmpStatus;
}

export class EmpApiService extends BaseApiClient {
  async SearchEmps(
    payload: SearchEmpsRequest
  ): Promise<ApiSuccessResponse<EmpResponseApi[]>> {
    const response = await this.get<ApiSuccessResponse<EmpResponseApi[]>>(
      "api/v1/emps/search",
      {
        params: {
          ...payload,
        },
      }
    );
    return response;
  }

  async GetEmpById(id: string): Promise<ApiSuccessResponse<EmpResponseApi>> {
    const response = await this.get<ApiSuccessResponse<EmpResponseApi>>(
      `api/v1/emps/find-by-id/${id}`
    );
    return response;
  }

  async UpdateEmpById(
    id: string,
    payload: UpdateEmpPayload
  ): Promise<ApiSuccessResponse<EmpResponseApi>> {
    const response = await this.put<ApiSuccessResponse<EmpResponseApi>>(
      `api/v1/emps/update-by-id/${id}`,
      payload
    );
    return response;
  }
}
