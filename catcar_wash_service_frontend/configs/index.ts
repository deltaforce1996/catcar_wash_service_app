export interface AppConfig {
  api: {
    baseURL: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    signature: {
      enabled: boolean;
      secretKey: string;
    };
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
  const runtimeConfig = useRuntimeConfig();

  const config: AppConfig = {
    app: {
      name: (runtimeConfig.public.appName as string) ?? "X-CatCar Wash Service",
      version: (runtimeConfig.public.appVersion as string) ?? "1.0.0",
    },
    api: {
      baseURL: runtimeConfig.public.apiUrl,
      timeout: (runtimeConfig.public.apiTimeout as number) ?? 10000,
      retryAttempts: (runtimeConfig.public.apiRetryAttempts as number) ?? 3,
      retryDelay: (runtimeConfig.public.apiRetryDelay as number) ?? 1000,
      signature: {
        enabled: (runtimeConfig.public.apiSignatureEnabled as boolean) ?? false,
        secretKey: (runtimeConfig.public.apiSignatureSecretKey as string) ?? "",
      },
    },
    debug: {
      enabled: (runtimeConfig.public.debugEnabled as boolean) ?? false,
      logLevel:
        (runtimeConfig.public.logLevel as
          | "debug"
          | "info"
          | "warn"
          | "error") ?? "info",
    },
  };

  return {
    config,
    log: {
      debug: (message: string, data?: unknown) => {
        if (config.debug.enabled && config.debug.logLevel === "debug") {
          console.debug(`🐛 [DEBUG] ${message}`, data);
        }
      },
      info: (message: string, data?: unknown) => {
        if (config.debug.enabled) {
          console.info(`ℹ️ [INFO] ${message}`, data);
        }
      },
      warn: (message: string, data?: unknown) => {
        console.warn(`⚠️ [WARN] ${message}`, data);
      },
      error: (message: string, data?: unknown) => {
        console.error(`❌ [ERROR] ${message}`, data);
      },
    },
  };
};
