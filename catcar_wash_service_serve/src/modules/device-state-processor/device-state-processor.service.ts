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
  private readonly MAX_REQUESTS_PER_MINUTE = 1; // 1 log per window
  private readonly WINDOW_SIZE_MS = 240000; // 4 นาที (4 * 60 * 1000 ms)
  private deviceTimestamps = new Map<string, number[]>();

  // Batch Processing Configuration
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_INTERVAL_MS = 5000; // 5 วินาที
  private messageBatch: ParsedDeviceMessage[] = [];
  private isProcessingBatch = false;

  // Offline Detection Configuration
  private readonly OFFLINE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
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
    skippedNonExistentDevices: 0,
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
      // รอให้ MQTT connection สำเร็จก่อน (แต่ถ้าไม่สำเร็จจะ log แล้วทำงานต่อ)
      await this.waitForMqttConnection();

      // Subscribe to device streaming topics
      await this.mqttService.subscribeToDeviceStreaming();

      // Register callback for device streaming messages
      this.mqttService.onMessage('server/+/streaming', (message: MqttMessage) => {
        // INSERT_YOUR_CODE
        this.handleDeviceStreamingMessage(message);
      });

      // this.logger.log('Device state processor initialized with MQTT subscriptions');
    } catch (error) {
      this.logger.error('Failed to initialize device state processor (will continue without MQTT):', error);
      // อย่า throw เพื่อให้ flow หลักยังทำงานต่อได้
    }
  }

  /**
   * Wait for MQTT connection to be established
   */
  private async waitForMqttConnection(): Promise<void> {
    const maxRetries = 30; // 30 วินาที
    const retryInterval = 1000; // 1 วินาที

    for (let i = 0; i < maxRetries; i++) {
      if (this.mqttService.isAvailable()) {
        // this.logger.log('MQTT connection established');
        return;
      }

      // this.logger.log(`Waiting for MQTT connection... (${i + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }

    this.logger.warn('MQTT connection timeout - continue running without MQTT subscriptions');
  }

  /**
   * Handle incoming device streaming messages
   */
  private handleDeviceStreamingMessage(message: MqttMessage): void {
    try {
      const parsedMessage = this.parseDeviceMessage(message);
      if (!parsedMessage) {
        // this.logger.warn(`⚠️ Invalid device message format for topic: ${message.topic}`);
        return;
      }

      // this.logger.debug(
      //   `📥 [Device ${parsedMessage.deviceId}] ==> [Server] streaming message: ${JSON.stringify(parsedMessage.payload)}`,
      // );

      this.stats.totalMessages++;

      // อัพเดท last seen timestamp (ก่อนตรวจสอบ rate limit เพื่อไม่ให้ถือว่า offline)
      this.deviceLastSeen.set(parsedMessage.deviceId, Date.now());

      // ตรวจสอบ rate limiting
      if (!this.isWithinSlidingWindowLimit(parsedMessage.deviceId)) {
        this.stats.rateLimitedMessages++;
        // this.logger.warn(`⚠️ Rate limited: Device ${parsedMessage.deviceId} - skipping message`);
        return;
      }

      // เพิ่มเข้า batch
      this.messageBatch.push(parsedMessage);

      // this.logger.debug(`✅ Message queued for batch processing: ${parsedMessage.deviceId}`);
    } catch (error) {
      this.logger.error(`❌ Error processing device streaming message from topic ${message.topic}:`, error);
    }
  }

  /**
   * ตรวจสอบว่า device ยังอยู่ในขีดจำกัดหรือไม่ (Sliding Window)
   */
  private isWithinSlidingWindowLimit(deviceId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE_MS; // 4 นาทีที่แล้ว

    // ดึง timestamps ของ device นี้
    let timestamps = this.deviceTimestamps.get(deviceId) || [];

    // ลบ timestamps ที่เก่ากว่า 4 นาที
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

      // สกัด unique deviceIds จาก batch
      const uniqueDeviceIds = [...new Set(batch.map((msg) => msg.deviceId))];

      // this.logger.log(`⚙️ Processing batch of ${batch.length} messages from ${uniqueDeviceIds.length} unique devices`);

      // Query unique devices ทั้งหมดพร้อมกันครั้งเดียว
      const devices = await this.prisma.tbl_devices.findMany({
        where: { id: { in: uniqueDeviceIds } },
        select: { id: true, status: true },
      });

      // สร้าง Map สำหรับการค้นหาแบบ O(1)
      const deviceMap = new Map(devices.map((d) => [d.id, d]));

      // this.logger.debug(`🔍 Found ${devices.length}/${uniqueDeviceIds.length} devices in database`);

      // กรอง messages ที่มี device อยู่จริง
      const validMessages: ParsedDeviceMessage[] = [];
      for (const message of batch) {
        const device = deviceMap.get(message.deviceId);
        if (!device) {
          this.stats.skippedNonExistentDevices++;
          // this.logger.warn(`❌ Device not found: ${message.deviceId} - skipping message`);
        } else {
          validMessages.push(message);
        }
      }

      if (validMessages.length === 0) {
        // this.logger.log('No valid messages to process in this batch');
        return;
      }

      try {
        // Batch insert ทุก messages ไปที่ tbl_devices_state
        await this.batchInsertDeviceStates(validMessages);

        // หา message ล่าสุดของแต่ละ device สำหรับ last_state
        const lastMessagePerDevice = this.getLastMessagePerDevice(validMessages);

        // Batch upsert last states
        await this.batchUpsertLastStates(lastMessagePerDevice);

        this.stats.processedMessages += validMessages.length;
        // this.logger.log(`✅ Successfully processed ${validMessages.length} messages`);
      } catch (error) {
        this.stats.droppedMessages += validMessages.length;
        this.logger.error('Error in batch processing:', error);
      }

      const processingTime = Date.now() - startTime;
      this.stats.averageProcessingTime =
        (this.stats.averageProcessingTime * (this.stats.batchProcessingCount - 1) + processingTime) /
        this.stats.batchProcessingCount;

      // this.logger.log(`⏱️ Batch processed in ${processingTime}ms`);
    } finally {
      this.isProcessingBatch = false;
    }
  }

  /**
   * Batch insert device states (historical data)
   */
  private async batchInsertDeviceStates(messages: ParsedDeviceMessage[]): Promise<void> {
    const stateRecords = messages.map((msg) => {
      const stateHash = this.generateStateHash(msg.payload);
      return {
        device_id: msg.deviceId,
        state_data: msg.payload as any,
        hash_state: stateHash,
      };
    });

    await this.prisma.tbl_devices_state.createMany({
      data: stateRecords,
      skipDuplicates: false,
    });

    // this.logger.debug(`💾 Batch inserted ${stateRecords.length} device states`);
  }

  /**
   * Get last message per device (based on timestamp in payload)
   */
  private getLastMessagePerDevice(messages: ParsedDeviceMessage[]): Map<string, ParsedDeviceMessage> {
    const lastMessages = new Map<string, ParsedDeviceMessage>();

    for (const message of messages) {
      const existing = lastMessages.get(message.deviceId);

      // ถ้ายังไม่มี หรือ message นี้มี timestamp ใหม่กว่า ให้เก็บ message นี้
      if (!existing || message.payload.timestamp > existing.payload.timestamp) {
        lastMessages.set(message.deviceId, message);
      }
    }

    // this.logger.debug(`📊 Extracted ${lastMessages.size} last messages from ${messages.length} total messages`);
    return lastMessages;
  }

  /**
   * Batch upsert last device states
   */
  private async batchUpsertLastStates(lastMessages: Map<string, ParsedDeviceMessage>): Promise<void> {
    // Prisma ไม่มี upsertMany ต้องใช้ Promise.all
    const upsertPromises = Array.from(lastMessages.values()).map((msg) => {
      const stateHash = this.generateStateHash(msg.payload);

      return this.prisma.tbl_devices_last_state.upsert({
        where: { device_id: msg.deviceId },
        update: {
          state_data: msg.payload as any,
          hash_state: stateHash,
        },
        create: {
          device_id: msg.deviceId,
          state_data: msg.payload as any,
          hash_state: stateHash,
        },
      });
    });

    await Promise.all(upsertPromises);
    // this.logger.debug(`🔄 Batch upserted ${lastMessages.size} last device states`);
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
      // this.logger.log(`🧹 Cleaned up ${cleanedDevices} inactive devices from rate limiting cache`);
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
    // const rateLimitStats = this.getRateLimitStats();
    // this.logger.log(`📊 === Device State Processor Stats ===`);
    // this.logger.log(`Total Messages: ${this.stats.totalMessages}`);
    // this.logger.log(`Processed Messages: ${this.stats.processedMessages}`);
    // this.logger.log(`Dropped Messages: ${this.stats.droppedMessages}`);
    // this.logger.log(`Rate Limited Messages: ${this.stats.rateLimitedMessages}`);
    // this.logger.log(`Skipped Non-Existent Devices: ${this.stats.skippedNonExistentDevices}`);
    // this.logger.log(`Batch Processing Count: ${this.stats.batchProcessingCount}`);
    // this.logger.log(`Average Processing Time: ${this.stats.averageProcessingTime.toFixed(2)}ms`);
    // this.logger.log(`Queue Size: ${this.messageBatch.length}`);
    // this.logger.log(`Active Devices: ${rateLimitStats.totalDevices}`);
    // this.logger.log(`Devices Near Limit: ${rateLimitStats.devicesNearLimit}`);
    // this.logger.log(`Devices At Limit: ${rateLimitStats.devicesAtLimit}`);
    // this.logger.log(`Tracked Devices: ${this.deviceLastSeen.size}`);
    // this.logger.log(`Offline Devices Detected: ${this.stats.offlineDevicesDetected}`);
    // this.logger.log(`=====================================`);
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

    // this.logger.log('Offline check interval started');
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
      // this.logger.log(`🔴 Detected ${offlineDevices.length} offline devices`);
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
        // this.logger.warn(`⚠️ Device not found for offline marking: ${deviceId}`);
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

      // this.logger.log(`🔴 Device marked as offline: ${deviceId}`);
    } catch (error) {
      this.logger.error(`❌ Error marking device as offline ${deviceId}:`, error);
    }
  }

  /**
   * Stop offline check interval
   */
  private stopOfflineCheck(): void {
    if (this.offlineCheckInterval) {
      clearInterval(this.offlineCheckInterval);
      this.offlineCheckInterval = null;
      // this.logger.log('Offline check interval stopped');
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
      const payloadStr = message.payload?.toString() || '';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const payload: DeviceStreamingPayload = JSON.parse(payloadStr);

      // Validate payload structure
      if (!this.validatePayload(payload)) {
        // this.logger.warn(`⚠️ Invalid payload structure for device ${deviceId}:`, payload);
        return null;
      }

      return {
        deviceId,
        payload,
        topic: message.topic,
      };
    } catch (error) {
      this.logger.error('❌ Error parsing device message:', error);
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
