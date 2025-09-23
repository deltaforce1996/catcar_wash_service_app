import type {
  ApiSuccessResponse,
  EnumPermissionType,
  EnumSortOrder,
  EnumUserStatus,
} from "~/types";
import { BaseApiClient } from "../bases/base-api-client";

export interface UserResponseApi {
  id: string;
  fullname: string;
  email: string;
  phone: string;
  address: string;
  custom_name: string;
  status: EnumUserStatus;
  created_at: string;
  updated_at: string;
  permission: { id: string; name: string };
  device_counts?: { total: number; active: number; inactive: number };
}
export interface PaginatedUserResponse {
  items: UserResponseApi[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchUsersRequest {
  query?: {
    search?: string; // search id, fullname, email, phone, and address fields
    status?: EnumUserStatus; // ACTIVE or INACTIVE
    permission?: EnumPermissionType; // ADMIN or TECHNICIAN or USER
    id?: string; // USER Page not implement id
    email?: string; // USER Page not implement email
    fullname?: string; // USER Page not implement fullname
    phone?: string; // USER Page not implement phone
    address?: string; // USER Page not implement address
    custom_name?: string; // USER Page not implement custom_name   
  };
  page?: number;
  limit?: number;
  sort_by?:
    | "created_at"
    | "updated_at"
    | "fullname"
    | "email"
    | "phone"
    | "address"
    | "status"
    | "permission";
  sort_order?: EnumSortOrder;
  exclude_device_counts?: boolean; // false if need full response true if need only user (For select user only)
}

export interface RegisterUserPayload {
  email: string;
  fullname: string;
  phone: string;
  address: string;
  custom_name: string;
  status: EnumUserStatus;
  permission_id: string;
}

export interface UpdateUserPayload {
  email?: string;
  fullname?: string;
  phone?: string;
  address?: string;
  custom_name?: string;
  status?: EnumUserStatus;
}

export interface UpdateUserProfilePayload extends UpdateUserPayload {
  payment_info?: {
    merchant_id?: string;
    api_key?: string;
    HMAC_key?: string;
  };
}

export class UserApiService extends BaseApiClient {
  private convertQueryToParams(query: SearchUsersRequest["query"]): string {
    if (!query) return "";
    const parts: string[] = [];
    for (const [key, value] of Object.entries(query)) {
      if (value != null && value !== "" && value.trim().toUpperCase() !== "ALL") {
        parts.push(`${key}: {${value}}`);
      }
    }
    return parts.join(" ");
  }
  async SearchUsers(
    payload: SearchUsersRequest
  ): Promise<ApiSuccessResponse<PaginatedUserResponse>> {
    const response = await this.get<ApiSuccessResponse<PaginatedUserResponse>>(
      "api/v1/users/search",
      {
        params: {
          query: this.convertQueryToParams(payload.query),
          page: payload.page,
          limit: payload.limit,
          sort_by: payload.sort_by,
          sort_order: payload.sort_order,
          exclude_device_counts: payload.exclude_device_counts ? true : undefined,
        },
      }
    );
    return response;
  }

  async GetUserById(id: string): Promise<ApiSuccessResponse<UserResponseApi>> {
    const response = await this.get<ApiSuccessResponse<UserResponseApi>>(
      `api/v1/users/find-by-id/${id}`
    );
    return response;
  }

  async RegisterUser(
    payload: RegisterUserPayload
  ): Promise<ApiSuccessResponse<UserResponseApi>> {
    const response = await this.post<ApiSuccessResponse<UserResponseApi>>(
      "api/v1/users/register",
      payload
    );
    return response;
  }

  async UpdateUserProfile(
    payload: UpdateUserProfilePayload
  ): Promise<ApiSuccessResponse<UserResponseApi>> {
    const response = await this.put<ApiSuccessResponse<UserResponseApi>>(
      "api/v1/users/update-profile",
      payload
    );
    return response;
  }

  async UpdateUserById(
    id: string,
    payload: UpdateUserPayload
  ): Promise<ApiSuccessResponse<UserResponseApi>> {
    const response = await this.put<ApiSuccessResponse<UserResponseApi>>(
      `api/v1/users/update-by-id/${id}`,
      payload
    );
    return response;
  }
}
