import type { ApiSuccessResponse } from "~/types";
import { BaseApiClient } from "../bases/base-api-client";

// AuthenticatedUser จะเป็น union type ของ UserResponseApi และ EmpResponseApi
export type AuthenticatedUser = UserResponseApi | EmpResponseApi;

export interface UserResponseApi {
  id: string;
  fullname: string;
  email: string;
  phone: string;
  address: string;
  custom_name: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  permission: { id: string; name: string };
  device_counts: { total: number; active: number; inactive: number };
}

export interface EmpResponseApi {
  id: string;
  name: string;
  email: string;
  phone: string;
  line: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  permission: { id: string; name: string };
}

export interface LoginPayload {
  email: string;
  password: string;
  role?: 'EMP' | 'USER';
}

export interface LoginResponse {
  token: string;
}

export class AuthApiService extends BaseApiClient {
  /**
   * Login with email and password
   * @param payload - Login credentials
   * @returns Promise with login response containing JWT token
   */
  async login(payload: LoginPayload): Promise<ApiSuccessResponse<LoginResponse>> {
    const response = await this.post<ApiSuccessResponse<LoginResponse>>(
      "api/v1/auth/login",
      payload
    );
    return response;
  }

  /**
   * Get current authenticated user information
   * @returns Promise with authenticated user data (UserResponseApi or EmpResponseApi based on permission)
   */
  async getCurrentUser(): Promise<ApiSuccessResponse<AuthenticatedUser>> {
    const response = await this.post<ApiSuccessResponse<AuthenticatedUser>>(
      "api/v1/auth/me"
    );
    return response;
  }

  /**
   * Login as User (convenience method)
   * @param email - User email
   * @param password - User password
   * @returns Promise with login response
   */
  async loginAsUser(email: string, password: string): Promise<ApiSuccessResponse<LoginResponse>> {
    return this.login({
      email,
      password,
      role: 'USER'
    });
  }

  /**
   * Login as Employee (convenience method)
   * @param email - Employee email
   * @param password - Employee password
   * @returns Promise with login response
   */
  async loginAsEmployee(email: string, password: string): Promise<ApiSuccessResponse<LoginResponse>> {
    return this.login({
      email,
      password,
      role: 'EMP'
    });
  }
}
