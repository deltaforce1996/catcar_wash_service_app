import { Injectable, Logger } from '@nestjs/common';
import { MqttCommandManagerService } from '../../services/adepters/mqtt-command-manager.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ItemNotFoundException } from '../../errors';
import { ApplyConfigDto, RestartDeviceDto, UpdateFirmwareDto, SendCustomCommandDto } from './dtos';
import type { MqttCommandAckResponse, CommandConfig, FirmwarePayload } from '../../types/mqtt-command-manager.types';

@Injectable()
export class DeviceCommandsService {
  private readonly logger = new Logger(DeviceCommandsService.name);

  constructor(
    private readonly mqttCommandManager: MqttCommandManagerService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('DeviceCommandsService initialized');
  }

  /**
   * Verify that device exists in database
   */
  private async verifyDevice(deviceId: string): Promise<void> {
    const device = await this.prisma.tbl_devices.findUnique({
      where: { id: deviceId },
      select: { id: true },
    });

    if (!device) {
      throw new ItemNotFoundException(`Device ${deviceId} not found`);
    }
  }

  /**
   * Apply configuration to device
   */
  async applyConfig(deviceId: string, config: ApplyConfigDto): Promise<MqttCommandAckResponse<CommandConfig>> {
    await this.verifyDevice(deviceId);

    this.logger.log(`Applying config to device: ${deviceId}`);

    const commandConfig: CommandConfig = {
      machine: config.machine,
      function: config.function,
      pricing: config.pricing,
      function_start: config.function_start,
      function_end: config.function_end,
    };

    const result = await this.mqttCommandManager.applyConfig(deviceId, commandConfig);

    this.logger.log(
      `Config application result for device ${deviceId}: ${result.status} (command_id: ${result.command_id})`,
    );

    return result;
  }

  /**
   * Restart device
   */
  async restartDevice(deviceId: string, restartDto: RestartDeviceDto): Promise<MqttCommandAckResponse<any>> {
    await this.verifyDevice(deviceId);

    this.logger.log(`Restarting device: ${deviceId} with delay: ${restartDto.delay_seconds}s`);

    const result = await this.mqttCommandManager.restartDevice(deviceId, restartDto.delay_seconds ?? 5);

    this.logger.log(`Restart result for device ${deviceId}: ${result.status} (command_id: ${result.command_id})`);

    return result;
  }

  /**
   * Update firmware
   */
  async updateFirmware(
    deviceId: string,
    firmwareDto: UpdateFirmwareDto,
  ): Promise<MqttCommandAckResponse<FirmwarePayload>> {
    await this.verifyDevice(deviceId);

    this.logger.log(`Updating firmware for device: ${deviceId} to version: ${firmwareDto.version}`);

    const firmwarePayload: FirmwarePayload = {
      url: firmwareDto.url,
      version: firmwareDto.version,
      sha256: firmwareDto.sha256,
      size: firmwareDto.size,
      reboot_after: firmwareDto.reboot_after,
    };

    const result = await this.mqttCommandManager.updateFirmware(deviceId, firmwarePayload);

    this.logger.log(
      `Firmware update result for device ${deviceId}: ${result.status} (command_id: ${result.command_id})`,
    );

    return result;
  }

  /**
   * Reset configuration on device
   */
  async resetConfig(deviceId: string, config: ApplyConfigDto): Promise<MqttCommandAckResponse<CommandConfig>> {
    await this.verifyDevice(deviceId);

    this.logger.log(`Resetting config for device: ${deviceId}`);

    const commandConfig: CommandConfig = {
      machine: config.machine,
      function: config.function,
      pricing: config.pricing,
      function_start: config.function_start,
      function_end: config.function_end,
    };

    const result = await this.mqttCommandManager.resetConfig(deviceId, commandConfig);

    this.logger.log(`Config reset result for device ${deviceId}: ${result.status} (command_id: ${result.command_id})`);

    return result;
  }

  /**
   * Send custom command to device
   */
  async sendCustomCommand(
    deviceId: string,
    customCommandDto: SendCustomCommandDto,
  ): Promise<MqttCommandAckResponse<any>> {
    await this.verifyDevice(deviceId);

    this.logger.log(`Sending custom command to device: ${deviceId}, command: ${customCommandDto.command}`);

    const result = await this.mqttCommandManager.sendCustomCommand(
      deviceId,
      customCommandDto.command,
      customCommandDto.payload,
      customCommandDto.require_ack ?? true,
    );

    this.logger.log(
      `Custom command result for device ${deviceId}: ${result.status} (command_id: ${result.command_id})`,
    );

    return result;
  }
}
