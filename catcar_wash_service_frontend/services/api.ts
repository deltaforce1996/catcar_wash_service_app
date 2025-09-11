import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import axios from "axios";
import { getConfigUtils } from "~/configs";
import { authTokenManager } from "~/utils/auth-token-manager";
import type { ApiErrorResponse } from "~/types";

const { config, log } = getConfigUtils();

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authTokenManager.getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    log.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      timestamp: new Date().toISOString(),
      data: config.data,
    });

    return config;
  },
  (error: AxiosError) => {
    log.error("API Request Error", error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    log.debug("API Response", response);
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    log.error("API Response Error", error);

    if (error.response?.status === 401 || error.response?.status === 403) {
      authTokenManager.clearToken();
      log.warn(
        error.response?.data.message || "Invalid token or access denied"
      );
    }

    if (error.response?.status === 500) {
      log.error("Server error: Please try again later");
    }

    return Promise.reject(error);
  }
);
