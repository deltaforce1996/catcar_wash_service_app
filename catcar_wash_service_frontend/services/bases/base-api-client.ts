import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosRequestConfig,
} from "axios";
import axios from "axios";
import { getConfigUtils } from "~/configs";
import { authTokenManager } from "~/utils/auth-token-manager";
import { SignatureUtils } from "~/utils/signature-utils";
import type { ApiErrorResponse } from "~/types";

/**
 * Base API Client Class
 * Provides common functionality for all API clients
 * Can be extended to create specific API clients for different services
 */
export abstract class BaseApiClient {
  protected readonly apiClient: AxiosInstance;
  protected readonly config: ReturnType<typeof getConfigUtils>["config"];
  protected readonly log: ReturnType<typeof getConfigUtils>["log"];

  constructor() {
    const { config, log } = getConfigUtils();
    this.config = config;
    this.log = log;

    this.log.debug("Base API Client Constructor", {
      baseURL: this.config.api.baseURL,
      timeout: this.config.api.timeout,
    });

    // Create axios instance with configuration
    this.apiClient = axios.create({
      baseURL: this.config.api.baseURL,
      timeout: this.config.api.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   * Can be overridden in child classes for custom behavior
   */
  protected setupInterceptors(): void {
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  /**
   * Setup request interceptor
   * Handles authentication, signature generation, and logging
   */
  protected setupRequestInterceptor(): void {
    this.apiClient.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Add authentication token
        const token = authTokenManager.getToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add x-signature if enabled
        if (
          this.config.api.signature.enabled &&
          this.config.api.signature.secretKey
        ) {
          try {
            const signature = await SignatureUtils.generateSignature(
              config,
              this.config.api.signature.secretKey
            );

            config.headers = config.headers || {};
            config.headers["x-signature"] = signature;

            this.log.debug("🔐 Signature added", { signature });
          } catch (error) {
            this.log.error("❌ Failed to generate signature", error);
          }
        }

        // Log request
        this.log.debug(
          `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
          {
            timestamp: new Date().toISOString(),
            data: config.data,
            headers: config.headers,
          }
        );

        return config;
      },
      (error: AxiosError) => {
        this.log.error("🚫 API Request Error", error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Setup response interceptor
   * Handles error responses and logging
   */
  protected setupResponseInterceptor(): void {
    this.apiClient.interceptors.response.use(
      (response: AxiosResponse) => {
        this.log.debug("✅ API Response", response);
        return response;
      },
      (error: AxiosError<ApiErrorResponse>) => {
        this.log.error("💥 API Response Error", error);

        // Handle authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          authTokenManager.clearToken();
          this.log.warn(
            `🔒 ${
              error.response?.data.message || "Invalid token or access denied"
            }`
          );
        }

        // Handle server errors
        if (error.response?.status === 500) {
          this.log.error("🔥 Server error: Please try again later");
        }

        return Promise.reject(error.response?.data);
      }
    );
  }

  /**
   * GET request
   */
  protected async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.apiClient.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  protected async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.apiClient.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  protected async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.apiClient.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  protected async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.apiClient.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  protected async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.apiClient.delete<T>(url, config);
    return response.data;
  }

  /**
   * Get the underlying axios instance
   * Useful for advanced usage
   */
  public getAxiosInstance(): AxiosInstance {
    return this.apiClient;
  }

  /**
   * Update base URL
   */
  public setBaseURL(baseURL: string): void {
    this.apiClient.defaults.baseURL = baseURL;
  }

  /**
   * Update timeout
   */
  public setTimeout(timeout: number): void {
    this.apiClient.defaults.timeout = timeout;
  }

  /**
   * Add or update default headers
   */
  public setDefaultHeader(key: string, value: string): void {
    this.apiClient.defaults.headers.common[key] = value;
  }

  /**
   * Remove default header
   */
  public removeDefaultHeader(key: string): void {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.apiClient.defaults.headers.common[key];
  }

  /**
   * Enable or disable signature generation
   */
  public setSignatureEnabled(enabled: boolean): void {
    this.config.api.signature.enabled = enabled;
    this.log.info(
      `🔐 Signature generation ${enabled ? "enabled" : "disabled"}`
    );
  }

  /**
   * Update signature secret key
   */
  public setSignatureSecretKey(secretKey: string): void {
    this.config.api.signature.secretKey = secretKey;
    this.log.info("🔐 Signature secret key updated");
  }
}
