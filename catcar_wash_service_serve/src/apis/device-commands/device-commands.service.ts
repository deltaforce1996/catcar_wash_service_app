import { Injectable, Logger } from '@nestjs/common';
import { MqttCommandManagerService } from '../../services/adepters/mqtt-command-manager.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ItemNotFoundException } from '../../errors';
import { RestartDeviceDto, UpdateFirmwareDto, SendCustomCommandDto } from './dtos';
import type { MqttCommandAckResponse, CommandConfig, FirmwarePayload } from '../../types/mqtt-command-manager.types';
import { DeviceType } from '@prisma/client';

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
   * Get device with configs from database
   */
  private async getDeviceWithConfig(deviceId: string) {
    const device = await this.prisma.tbl_devices.findUnique({
      where: { id: deviceId },
      select: {
        id: true,
        type: true,
        configs: true,
      },
    });

    if (!device) {
      throw new ItemNotFoundException(`Device ${deviceId} not found`);
    }

    if (!device.configs) {
      throw new ItemNotFoundException(`Device ${deviceId} has no configuration`);
    }

    return device;
  }

  /**
   * Map database config to CommandConfig based on device type
   */
  private mapToCommandConfig(dbConfig: any, deviceType: DeviceType): CommandConfig {
    const system = dbConfig.system || {};
    const sale = dbConfig.sale || {};
    const pricing = dbConfig.pricing || {};

    // Machine config (common for both types)
    const machine = {
      ACTIVE: true,
      BANKNOTE: system.payment_method?.bank_note ?? true,
      COIN: system.payment_method?.coin ?? true,
      QR: system.payment_method?.promptpay ?? true,
      ON_TIME: system.on_time ?? '00:00',
      OFF_TIME: system.off_time ?? '23:59',
      SAVE_STATE: system.save_state ?? true,
    };

    const commandConfig: CommandConfig = { machine };

    if (deviceType === DeviceType.WASH) {
      // WASH device: has function with sec_per_baht
      commandConfig.function = {
        sec_per_baht: {
          HP_WATER: sale.hp_water?.value ?? 10,
          FOAM: sale.foam?.value ?? 10,
          AIR: sale.air?.value ?? 10,
          WATER: sale.water?.value ?? 10,
          VACUUM: sale.vacuum?.value ?? 10,
          BLACK_TIRE: sale.black_tire?.value ?? 10,
          WAX: sale.wax?.value ?? 10,
          AIR_FRESHENER: sale.air_conditioner?.value ?? 10,
          PARKING_FEE: sale.parking_fee?.value ?? 10,
        },
      };
    } else if (deviceType === DeviceType.DRYING) {
      // DRYING device: has pricing, function_start, function_end
      commandConfig.pricing = {
        BASE_FEE: pricing.base_fee?.value ?? 10,
        PROMOTION: pricing.promotion?.value ?? 0,
        WORK_PERIOD: pricing.work_period?.value ?? 600,
      };

      commandConfig.function_start = {
        DUST_BLOW: sale.blow_dust?.start ?? 0,
        SANITIZE: sale.sterilize?.start ?? 100,
        UV: sale.uv?.start ?? 200,
        OZONE: sale.ozone?.start ?? 300,
        DRY_BLOW: sale.drying?.start ?? 400,
        PERFUME: sale.perfume?.start ?? 500,
      };

      commandConfig.function_end = {
        DUST_BLOW: sale.blow_dust?.end ?? 100,
        SANITIZE: sale.sterilize?.end ?? 200,
        UV: sale.uv?.end ?? 300,
        OZONE: sale.ozone?.end ?? 400,
        DRY_BLOW: sale.drying?.end ?? 500,
        PERFUME: sale.perfume?.end ?? 600,
      };
    }

    return commandConfig;
  }

  /**
   * Apply configuration to device
   */
  async applyConfig(deviceId: string): Promise<MqttCommandAckResponse<CommandConfig>> {
    const device = await this.getDeviceWithConfig(deviceId);

    this.logger.log(`Applying config to device: ${deviceId} (type: ${device.type})`);

    const commandConfig = this.mapToCommandConfig(device.configs, device.type);

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
  async resetConfig(deviceId: string): Promise<MqttCommandAckResponse<CommandConfig>> {
    const device = await this.getDeviceWithConfig(deviceId);

    this.logger.log(`Resetting config for device: ${deviceId} (type: ${device.type})`);

    const commandConfig = this.mapToCommandConfig(device.configs, device.type);

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
