import type {
  ApiSuccessResponse,
  EnumEmpStatus,
  EnumPermissionType,
  EnumSortOrder,
} from "~/types";
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
  query?: {
    search?: string; // search id, name, email, line, address fields
    status?: EnumEmpStatus; // ACTIVE or INACTIVE
    permission?: EnumPermissionType; //  TECHNICIAN or USER
    id?: string; // EMP Page not implement id
    email?: string; // EMP Page not implement email
    name?: string; // EMP Page not implement name
    phone?: string; // EMP Page not implement phone
    line?: string; // EMP Page not implement line
    address?: string; // EMP Page not implement address
  };
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

export interface CreateEmpPayload {
  name: string;
  email: string;
  phone?: string;
  line?: string;
  address?: string;
}

export interface UpdateEmpPayload {
  email?: string;
  name?: string;
  phone?: string;
  line?: string;
  address?: string;
  status?: EnumEmpStatus; // ACTIVE or INACTIVE
}


export interface PaginatedEmpResponse {
  items: EmpResponseApi[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class EmpApiService extends BaseApiClient {
  private convertQueryToParams(query: SearchEmpsRequest["query"]): string {
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
  async SearchEmps(
    payload: SearchEmpsRequest
  ): Promise<ApiSuccessResponse<PaginatedEmpResponse>> {
    const response = await this.get<ApiSuccessResponse<PaginatedEmpResponse>>(
      "api/v1/emps/search",
      {
        params: {
          query: this.convertQueryToParams(payload.query),
          page: payload.page,
          limit: payload.limit,
          sort_by: payload.sort_by,
          sort_order: payload.sort_order,
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

  async RegisterEmp(
    payload: CreateEmpPayload
  ): Promise<ApiSuccessResponse<EmpResponseApi>> {
    const response = await this.post<ApiSuccessResponse<EmpResponseApi>>(
      "api/v1/emps/register",
      payload
    );
    return response;
  }

  async UpdateEmpProfile(
    payload: UpdateEmpPayload
  ): Promise<ApiSuccessResponse<EmpResponseApi>> {
    const response = await this.put<ApiSuccessResponse<EmpResponseApi>>(
      "api/v1/emps/update-profile",
      payload
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
