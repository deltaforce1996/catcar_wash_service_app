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
  device: {
    ackTimeoutSeconds: number; // Backend MQTT timeout for device ACK
    ackTimeoutMs: number; // Frontend axios timeout (should be ackTimeoutSeconds * 1000 + buffer)
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

  const isEmpty = (value: string | number | boolean | undefined | null) => {
    return value === undefined || value === null || value === "";
  };

  const getDefault = <T extends string | number | boolean>(
    value: string | number | boolean | undefined | null,
    defaultValue: string | number | boolean
  ): T => {
    return isEmpty(value) ? (defaultValue as T) : (value as T);
  };

  console.log("runtimeConfig", runtimeConfig.public.apiUrl);

  // Device ACK timeout: backend waits 10s, frontend waits 15s (10s + 5s buffer)
  const deviceAckTimeoutSeconds = getDefault<number>(
    runtimeConfig.public.deviceAckTimeoutSeconds as unknown as number,
    10
  );

  const config: AppConfig = {
    app: {
      name: getDefault(runtimeConfig.public.appName, "X-CatCar Wash Service"),
      version: "1.0.0",
    },
    api: {
      baseURL: getDefault(runtimeConfig.public.apiUrl, "http://localhost:3000"),
      timeout: getDefault(runtimeConfig.public.apiTimeout, 10000),
      retryAttempts: getDefault(runtimeConfig.public.apiRetryAttempts, 3),
      retryDelay: getDefault(runtimeConfig.public.apiRetryDelay, 1000),
      signature: {
        enabled: false,
        secretKey: "Cat Car Wash Service",
      },
    },
    device: {
      ackTimeoutSeconds: deviceAckTimeoutSeconds,
      ackTimeoutMs: deviceAckTimeoutSeconds * 1000 + 5000, // Add 5s buffer for network latency
    },
    debug: {
      enabled: true,
      logLevel: "debug",
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
