import { Body, Controller, Param, Post, UseFilters } from '@nestjs/common';
import { DeviceCommandsService } from './device-commands.service';
import { AllExceptionFilter } from '../../common';
import type { SuccessResponse } from '../../types';
import { RestartDeviceDto, SendCustomCommandDto, ManualPaymentDto } from './dtos';
import type {
  MqttCommandAckResponse,
  CommandConfig,
  FirmwarePayload,
  ManualPaymentPayload,
} from '../../types/mqtt-command-manager.types';

@UseFilters(AllExceptionFilter)
@Controller('api/v1/device-commands')
export class DeviceCommandsController {
  constructor(private readonly deviceCommandsService: DeviceCommandsService) {}

  /**
   * Apply configuration to device
   * POST /api/v1/device-commands/:deviceId/apply-config
   */
  @Post(':deviceId/apply-config')
  async applyConfig(
    @Param('deviceId') deviceId: string,
  ): Promise<SuccessResponse<MqttCommandAckResponse<CommandConfig>>> {
    const result = await this.deviceCommandsService.applyConfig(deviceId);
    return {
      success: true,
      data: result,
      message: `ส่งคำสั่งการตั้งค่าไปยังอุปกรณ์ ${deviceId} สำเร็จ`,
    };
  }

  /**
   * Restart device
   * POST /api/v1/device-commands/:deviceId/restart
   */
  @Post(':deviceId/restart')
  async restartDevice(
    @Param('deviceId') deviceId: string,
    @Body() restartDto: RestartDeviceDto,
  ): Promise<SuccessResponse<MqttCommandAckResponse<any>>> {
    const result = await this.deviceCommandsService.restartDevice(deviceId, restartDto);
    return {
      success: true,
      data: result,
      message: `ส่งคำสั่งรีสตาร์ทไปยังอุปกรณ์ ${deviceId} สำเร็จ`,
    };
  }

  /**
   * Update firmware
   * POST /api/v1/device-commands/:deviceId/update-firmware
   * Note: Firmware info is fetched from static URL on the backend
   */
  @Post(':deviceId/update-firmware')
  async updateFirmware(
    @Param('deviceId') deviceId: string,
  ): Promise<SuccessResponse<MqttCommandAckResponse<FirmwarePayload>>> {
    const result = await this.deviceCommandsService.updateFirmware(deviceId);
    return {
      success: true,
      data: result,
      message: `ส่งคำสั่งอัพเดทเฟิร์มแวร์ไปยังอุปกรณ์ ${deviceId} สำเร็จ`,
    };
  }

  /**
   * Reset configuration
   * POST /api/v1/device-commands/:deviceId/reset-config
   */
  @Post(':deviceId/reset-config')
  async resetConfig(
    @Param('deviceId') deviceId: string,
  ): Promise<SuccessResponse<MqttCommandAckResponse<CommandConfig>>> {
    const result = await this.deviceCommandsService.resetConfig(deviceId);
    return {
      success: true,
      data: result,
      message: `ส่งคำสั่งรีเซ็ตการตั้งค่าไปยังอุปกรณ์ ${deviceId} สำเร็จ`,
    };
  }

  /**
   * Send custom command
   * POST /api/v1/device-commands/:deviceId/custom
   */
  @Post(':deviceId/custom')
  async sendCustomCommand(
    @Param('deviceId') deviceId: string,
    @Body() customCommandDto: SendCustomCommandDto,
  ): Promise<SuccessResponse<MqttCommandAckResponse<any>>> {
    const result = await this.deviceCommandsService.sendCustomCommand(deviceId, customCommandDto);
    return {
      success: true,
      data: result,
      message: `ส่งคำสั่งกำหนดเองไปยังอุปกรณ์ ${deviceId} สำเร็จ`,
    };
  }

  /**
   * Send manual payment
   * POST /api/v1/device-commands/:deviceId/manual-payment
   */
  @Post(':deviceId/manual-payment')
  async sendManualPayment(
    @Param('deviceId') deviceId: string,
    @Body() manualPaymentDto: ManualPaymentDto,
  ): Promise<SuccessResponse<MqttCommandAckResponse<ManualPaymentPayload>>> {
    const result = await this.deviceCommandsService.sendManualPayment(deviceId, manualPaymentDto);
    return {
      success: true,
      data: result,
      message: `ส่งการชำระเงินแบบแมนนวลไปยังอุปกรณ์ ${deviceId} สำเร็จ`,
    };
  }
}
