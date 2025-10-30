import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: process.env.PORT ?? 3000,
  environment: process.env.NODE_ENV ?? 'development',
  apiPrefix: process.env.API_PREFIX ?? 'api',
  version: process.env.VERSION ?? '1.0.0',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  deviceSecretKey: process.env.DEVICE_SECRET_KEY ?? 'modernchabackdoor',
  mqttBrokerUrl: process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883',
  mqttClientId: process.env.MQTT_CLIENT_ID ?? `catcar-wash-${Date.now()}`,
  mqttUsername: process.env.MQTT_USERNAME,
  mqttPassword: process.env.MQTT_PASSWORD,
  mqttKeepalive: process.env.MQTT_KEEPALIVE ?? 60,
  mqttConnectTimeout: process.env.MQTT_CONNECT_TIMEOUT ?? 30000,
  mqttReconnectPeriod: process.env.MQTT_RECONNECT_PERIOD ?? 5000,
  mqttClean: process.env.MQTT_CLEAN ?? true,
  mqttQos: process.env.MQTT_QOS ?? 1,
  mqttMaxReconnectAttempts: process.env.MQTT_MAX_RECONNECT_ATTEMPTS ?? 5,
}));
