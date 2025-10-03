import type { ApiSuccessResponse } from "~/types";
import { BaseApiClient } from "../bases/base-api-client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  permission: {
    id: string;
    name: string;
  };
  status: 'ACTIVE' | 'INACTIVE';
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
   * @returns Promise with authenticated user data
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
