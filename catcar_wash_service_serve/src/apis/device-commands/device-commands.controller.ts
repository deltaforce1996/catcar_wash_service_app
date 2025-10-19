import { Body, Controller, Param, Post, UseFilters } from '@nestjs/common';
import { DeviceCommandsService } from './device-commands.service';
import { AllExceptionFilter } from '../../common';
import type { SuccessResponse } from '../../types';
import { RestartDeviceDto, UpdateFirmwareDto, SendCustomCommandDto } from './dtos';
import type { MqttCommandAckResponse, CommandConfig, FirmwarePayload } from '../../types/mqtt-command-manager.types';

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
      message: `Command sent to device ${deviceId}`,
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
      message: `Restart command sent to device ${deviceId}`,
    };
  }

  /**
   * Update firmware
   * POST /api/v1/device-commands/:deviceId/update-firmware
   */
  @Post(':deviceId/update-firmware')
  async updateFirmware(
    @Param('deviceId') deviceId: string,
    @Body() firmwareDto: UpdateFirmwareDto,
  ): Promise<SuccessResponse<MqttCommandAckResponse<FirmwarePayload>>> {
    const result = await this.deviceCommandsService.updateFirmware(deviceId, firmwareDto);
    return {
      success: true,
      data: result,
      message: `Firmware update command sent to device ${deviceId}`,
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
      message: `Config reset command sent to device ${deviceId}`,
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
      message: `Custom command sent to device ${deviceId}`,
    };
  }
}
