import type {
  ApiSuccessResponse,
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
export interface SearchUsersRequest {
  query?: string;
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
  exclude_device_counts?: boolean;
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
  async SearchUsers(
    payload: SearchUsersRequest
  ): Promise<ApiSuccessResponse<UserResponseApi[]>> {
    const response = await this.get<ApiSuccessResponse<UserResponseApi[]>>(
      "api/v1/users/search",
      {
        params: {
          ...payload,
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
