export interface AppConfig {
  api: {
    baseURL: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  app: {
    name: string;
    version: string;
  };
  debug: {
    enabled: boolean;
    logLevel: "debug" | "info" | "warn" | "error";
  };
}

export const getConfigUtils = () => {
  const getEnvValue = (envKey: string): string | null => {
    return typeof process !== "undefined" ? process.env[envKey] ?? null : null;
  };

  const config: AppConfig = {
    app: {
      name: getEnvValue("APP_NAME") ?? "",
      version: getEnvValue("APP_VERSION") ?? "",
    },
    api: {
      baseURL: getEnvValue("API_BASE_URL") ?? "",
      timeout: parseInt(getEnvValue("API_TIMEOUT") ?? "10000", 10),
      retryAttempts: parseInt(getEnvValue("API_RETRY_ATTEMPTS") ?? "3", 10),
      retryDelay: parseInt(getEnvValue("API_RETRY_DELAY") ?? "1000", 10),
    },
    debug: {
      enabled: getEnvValue("DEBUG_ENABLED") === "true",
      logLevel:
        (getEnvValue("LOG_LEVEL") as "debug" | "info" | "warn" | "error") ??
        "info",
    },
  };

  return {
    config,
    log: {
      debug: (message: string, data?: unknown) => {
        if (config.debug.enabled && config.debug.logLevel === "debug") {
          console.debug(`[DEBUG] ${message}`, data);
        }
      },
      info: (message: string, data?: unknown) => {
        if (config.debug.enabled) {
          console.info(`[INFO] ${message}`, data);
        }
      },
      warn: (message: string, data?: unknown) => {
        console.warn(`[WARN] ${message}`, data);
      },
      error: (message: string, data?: unknown) => {
        console.error(`[ERROR] ${message}`, data);
      },
    },
  };
};
