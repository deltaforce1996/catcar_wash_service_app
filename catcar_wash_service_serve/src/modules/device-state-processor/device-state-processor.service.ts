import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { MqttService, type MqttMessage } from '../mqtt';
import { createHash } from 'crypto';

export interface DeviceStreamingPayload {
  rssi: number;
  status: 'NORMAL' | 'ERROR' | 'OFFLINE';
  uptime: number; // นาที
  timestamp: number;
}

export interface ParsedDeviceMessage {
  deviceId: string;
  payload: DeviceStreamingPayload;
  topic: string;
}

@Injectable()
export class DeviceStateProcessorService implements OnModuleInit {
  private readonly logger = new Logger(DeviceStateProcessorService.name);

  // Rate Limiting Configuration
  private readonly MAX_REQUESTS_PER_MINUTE = 8;
  private readonly WINDOW_SIZE_MS = 60000; // 1 นาที
  private deviceTimestamps = new Map<string, number[]>();

  // Batch Processing Configuration
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_INTERVAL_MS = 5000; // 5 วินาที
  private messageBatch: ParsedDeviceMessage[] = [];
  private isProcessingBatch = false;

  // Offline Detection Configuration
  private readonly OFFLINE_TIMEOUT = 10000; // 10 seconds in milliseconds
  private deviceLastSeen = new Map<string, number>(); // deviceId -> lastSeen timestamp
  private offlineCheckInterval: NodeJS.Timeout | null = null;

  // Statistics
  private stats = {
    totalMessages: 0,
    processedMessages: 0,
    droppedMessages: 0,
    rateLimitedMessages: 0,
    batchProcessingCount: 0,
    averageProcessingTime: 0,
    offlineDevicesDetected: 0,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly mqttService: MqttService,
  ) {
    // เริ่ม batch processing
    this.startBatchProcessing();

    // เริ่ม cleanup old data
    this.startCleanupProcess();

    // เริ่ม statistics logging
    this.startStatsLogging();
  }

  /**
   * Initialize service when module starts
   */
  async onModuleInit() {
    await this.initializeSubscriptions();
    this.startOfflineCheck();
  }

  /**
   * Initialize MQTT subscriptions for device streaming
   */
  async initializeSubscriptions(): Promise<void> {
    try {
      // Subscribe to device streaming topics
      await this.mqttService.subscribeToDeviceStreaming();

      // Register callback for device streaming messages
      this.mqttService.onMessage('server/+/streaming', (message: MqttMessage) => {
        this.handleDeviceStreamingMessage(message);
      });

      this.logger.log('Device state processor initialized with MQTT subscriptions');
    } catch (error) {
      this.logger.error('Failed to initialize device state processor:', error);
      throw error;
    }
  }

  /**
   * Handle incoming device streaming messages
   */
  private handleDeviceStreamingMessage(message: MqttMessage): void {
    try {
      const parsedMessage = this.parseDeviceMessage(message);
      if (!parsedMessage) {
        this.logger.warn(`Invalid device message format for topic: ${message.topic}`);
        return;
      }

      this.stats.totalMessages++;

      // ตรวจสอบ rate limiting
      if (!this.isWithinSlidingWindowLimit(parsedMessage.deviceId)) {
        this.stats.rateLimitedMessages++;
        this.logger.debug(`Rate limited: Device ${parsedMessage.deviceId} - skipping message`);
        return;
      }

      // อัพเดท last seen timestamp
      this.deviceLastSeen.set(parsedMessage.deviceId, Date.now());

      // เพิ่มเข้า batch
      this.messageBatch.push(parsedMessage);

      this.logger.debug(`Message queued for batch processing: ${parsedMessage.deviceId}`);
    } catch (error) {
      this.logger.error(`Error processing device streaming message from topic ${message.topic}:`, error);
    }
  }

  /**
   * ตรวจสอบว่า device ยังอยู่ในขีดจำกัดหรือไม่ (Sliding Window)
   */
  private isWithinSlidingWindowLimit(deviceId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE_MS; // 1 นาทีที่แล้ว

    // ดึง timestamps ของ device นี้
    let timestamps = this.deviceTimestamps.get(deviceId) || [];

    // ลบ timestamps ที่เก่ากว่า 1 นาที
    timestamps = timestamps.filter((timestamp) => timestamp > windowStart);

    // ตรวจสอบว่ายังไม่เกินขีดจำกัด
    if (timestamps.length >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    // เพิ่ม timestamp ปัจจุบัน
    timestamps.push(now);
    this.deviceTimestamps.set(deviceId, timestamps);

    return true;
  }

  /**
   * เริ่ม batch processing
   */
  private startBatchProcessing(): void {
    setInterval(() => {
      void this.processBatch();
    }, this.BATCH_INTERVAL_MS);
  }

  /**
   * ประมวลผล batch
   */
  private async processBatch(): Promise<void> {
    if (this.messageBatch.length === 0 || this.isProcessingBatch) {
      return;
    }

    this.isProcessingBatch = true;
    this.stats.batchProcessingCount++;

    try {
      const startTime = Date.now();
      const batch = this.messageBatch.splice(0, this.BATCH_SIZE);

      this.logger.log(`Processing batch of ${batch.length} messages`);

      // ประมวลผลทีละ message ใน batch
      for (let i = 0; i < batch.length; i++) {
        const message = batch[i];

        try {
          await this.saveDeviceState(message);
          this.stats.processedMessages++;
          this.logger.debug(`Device state saved for device: ${message.deviceId}`);
        } catch (error) {
          this.stats.droppedMessages++;
          this.logger.error(`Error saving device state for device ${message.deviceId}:`, error);
        }

        // รอ 100ms ก่อนประมวลผล message ถัดไป
        if (i < batch.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      const processingTime = Date.now() - startTime;
      this.stats.averageProcessingTime =
        (this.stats.averageProcessingTime * (this.stats.batchProcessingCount - 1) + processingTime) /
        this.stats.batchProcessingCount;

      this.logger.log(`Batch processed in ${processingTime}ms`);
    } finally {
      this.isProcessingBatch = false;
    }
  }

  /**
   * เริ่ม cleanup process
   */
  private startCleanupProcess(): void {
    // ทำความสะอาดข้อมูลเก่าทุก 10 นาที
    setInterval(
      () => {
        this.cleanupOldData();
      },
      10 * 60 * 1000,
    );
  }

  /**
   * ทำความสะอาดข้อมูลเก่า
   */
  private cleanupOldData(): void {
    const now = Date.now();
    const cleanupThreshold = now - 10 * 60 * 1000; // 10 นาทีที่แล้ว

    let cleanedDevices = 0;

    for (const [deviceId, timestamps] of this.deviceTimestamps.entries()) {
      const filteredTimestamps = timestamps.filter((timestamp) => timestamp > cleanupThreshold);

      if (filteredTimestamps.length === 0) {
        this.deviceTimestamps.delete(deviceId);
        cleanedDevices++;
      } else {
        this.deviceTimestamps.set(deviceId, filteredTimestamps);
      }
    }

    if (cleanedDevices > 0) {
      this.logger.log(`Cleaned up ${cleanedDevices} inactive devices from rate limiting cache`);
    }
  }

  /**
   * เริ่ม statistics logging
   */
  private startStatsLogging(): void {
    // แสดงสถิติทุก 5 นาที
    setInterval(
      () => {
        this.logStats();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * แสดงสถิติ
   */
  private logStats(): void {
    const rateLimitStats = this.getRateLimitStats();

    this.logger.log(`=== Device State Processor Stats ===`);
    this.logger.log(`Total Messages: ${this.stats.totalMessages}`);
    this.logger.log(`Processed Messages: ${this.stats.processedMessages}`);
    this.logger.log(`Dropped Messages: ${this.stats.droppedMessages}`);
    this.logger.log(`Rate Limited Messages: ${this.stats.rateLimitedMessages}`);
    this.logger.log(`Batch Processing Count: ${this.stats.batchProcessingCount}`);
    this.logger.log(`Average Processing Time: ${this.stats.averageProcessingTime.toFixed(2)}ms`);
    this.logger.log(`Queue Size: ${this.messageBatch.length}`);
    this.logger.log(`Active Devices: ${rateLimitStats.totalDevices}`);
    this.logger.log(`Devices Near Limit: ${rateLimitStats.devicesNearLimit}`);
    this.logger.log(`Devices At Limit: ${rateLimitStats.devicesAtLimit}`);
    this.logger.log(`Tracked Devices: ${this.deviceLastSeen.size}`);
    this.logger.log(`Offline Devices Detected: ${this.stats.offlineDevicesDetected}`);
    this.logger.log(`=====================================`);
  }

  /**
   * รับสถิติ rate limiting
   */
  private getRateLimitStats(): any {
    const stats = {
      totalDevices: this.deviceTimestamps.size,
      devicesNearLimit: 0,
      devicesAtLimit: 0,
    };

    for (const [, timestamps] of this.deviceTimestamps.entries()) {
      const now = Date.now();
      const windowStart = now - this.WINDOW_SIZE_MS;
      const recentTimestamps = timestamps.filter((timestamp) => timestamp > windowStart);

      if (recentTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE) {
        stats.devicesAtLimit++;
      } else if (recentTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE * 0.8) {
        stats.devicesNearLimit++;
      }
    }

    return stats;
  }

  /**
   * Start offline check interval
   */
  private startOfflineCheck(): void {
    // Check every 5 seconds for devices that haven't sent data
    this.offlineCheckInterval = setInterval(() => {
      void this.checkForOfflineDevices();
    }, 5000);

    this.logger.log('Offline check interval started');
  }

  /**
   * Check for devices that haven't sent data for more than 10 seconds
   */
  private async checkForOfflineDevices(): Promise<void> {
    const now = Date.now();
    const offlineDevices: string[] = [];

    for (const [deviceId, lastSeen] of this.deviceLastSeen.entries()) {
      if (now - lastSeen > this.OFFLINE_TIMEOUT) {
        offlineDevices.push(deviceId);
      }
    }

    // Process offline devices
    for (const deviceId of offlineDevices) {
      await this.markDeviceAsOffline(deviceId);
      // Remove from tracking to avoid duplicate processing
      this.deviceLastSeen.delete(deviceId);
      this.stats.offlineDevicesDetected++;
    }

    if (offlineDevices.length > 0) {
      this.logger.log(`Detected ${offlineDevices.length} offline devices`);
    }
  }

  /**
   * Mark device as offline
   */
  private async markDeviceAsOffline(deviceId: string): Promise<void> {
    try {
      // Check if device exists
      const device = await this.prisma.tbl_devices.findUnique({
        where: { id: deviceId },
        select: { id: true, status: true },
      });

      if (!device) {
        this.logger.warn(`Device not found for offline marking: ${deviceId}`);
        return;
      }

      // Create offline payload
      const offlinePayload: DeviceStreamingPayload = {
        rssi: 0,
        status: 'OFFLINE',
        uptime: 0,
        timestamp: Date.now(),
      };

      // Generate hash for offline state
      const stateHash = this.generateStateHash(offlinePayload);

      // Use transaction to ensure data consistency
      await this.prisma.$transaction(async (tx) => {
        // Save to historical states table
        await tx.tbl_devices_state.create({
          data: {
            device_id: deviceId,
            state_data: offlinePayload as any,
            hash_state: stateHash,
          },
        });

        // Update last state table (upsert)
        await tx.tbl_devices_last_state.upsert({
          where: { device_id: deviceId },
          update: {
            state_data: offlinePayload as any,
            hash_state: stateHash,
          },
          create: {
            device_id: deviceId,
            state_data: offlinePayload as any,
            hash_state: stateHash,
          },
        });
      });

      this.logger.log(`Device marked as offline: ${deviceId}`);
    } catch (error) {
      this.logger.error(`Error marking device as offline ${deviceId}:`, error);
    }
  }

  /**
   * Stop offline check interval
   */
  private stopOfflineCheck(): void {
    if (this.offlineCheckInterval) {
      clearInterval(this.offlineCheckInterval);
      this.offlineCheckInterval = null;
      this.logger.log('Offline check interval stopped');
    }
  }

  /**
   * Parse MQTT message to extract device ID and payload
   */
  private parseDeviceMessage(message: MqttMessage): ParsedDeviceMessage | null {
    try {
      // Extract device ID from topic: server/{device_id}/streaming
      const topicMatch = message.topic.match(/^server\/([^/]+)\/streaming$/);
      if (!topicMatch) {
        return null;
      }

      const deviceId = topicMatch[1];

      // Parse JSON payload
      const payloadStr = message.payload.toString();
      const payload: DeviceStreamingPayload = JSON.parse(payloadStr);

      // Validate payload structure
      if (!this.validatePayload(payload)) {
        this.logger.warn(`Invalid payload structure for device ${deviceId}:`, payload);
        return null;
      }

      return {
        deviceId,
        payload,
        topic: message.topic,
      };
    } catch (error) {
      this.logger.error('Error parsing device message:', error);
      return null;
    }
  }

  /**
   * Validate device streaming payload
   */
  private validatePayload(payload: unknown): payload is DeviceStreamingPayload {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const p = payload as Record<string, unknown>;

    return (
      'rssi' in p &&
      'status' in p &&
      'uptime' in p &&
      'timestamp' in p &&
      typeof p.rssi === 'number' &&
      ['NORMAL', 'ERROR', 'OFFLINE'].includes(p.status as string) &&
      typeof p.uptime === 'number' &&
      typeof p.timestamp === 'number'
    );
  }

  /**
   * Save device state to database
   */
  private async saveDeviceState(parsedMessage: ParsedDeviceMessage): Promise<void> {
    const { deviceId, payload } = parsedMessage;

    try {
      // Check if device exists
      const device = await this.prisma.tbl_devices.findUnique({
        where: { id: deviceId },
        select: { id: true, status: true },
      });

      if (!device) {
        this.logger.warn(`Device not found: ${deviceId}`);
        return;
      }

      // Generate hash for state data to detect changes
      const stateHash = this.generateStateHash(payload);

      // Use transaction to ensure data consistency
      await this.prisma.$transaction(async (tx) => {
        // Save to historical states table
        await tx.tbl_devices_state.create({
          data: {
            device_id: deviceId,
            state_data: payload as any,
            hash_state: stateHash,
          },
        });

        // Update last state table (upsert)
        await tx.tbl_devices_last_state.upsert({
          where: { device_id: deviceId },
          update: {
            state_data: payload as any,
            hash_state: stateHash,
          },
          create: {
            device_id: deviceId,
            state_data: payload as any,
            hash_state: stateHash,
          },
        });
      });

      this.logger.debug(`Device state saved successfully for device: ${deviceId}`);
    } catch (error) {
      this.logger.error(`Error saving device state for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Generate hash for state data to detect changes
   */
  private generateStateHash(payload: DeviceStreamingPayload): string {
    const hash = createHash('sha256');
    hash.update(
      JSON.stringify({
        rssi: payload.rssi,
        status: payload.status,
        uptime: payload.uptime,
      }),
    );
    return hash.digest('hex');
  }

  /**
   * รับสถิติปัจจุบัน
   */
  getStats() {
    return {
      ...this.stats,
      queueSize: this.messageBatch.length,
      isProcessingBatch: this.isProcessingBatch,
      rateLimitStats: this.getRateLimitStats(),
      trackedDevicesCount: this.deviceLastSeen.size,
    };
  }
}
