import { ref, readonly } from "vue";
import type {
  RestartDevicePayload,
  SendCustomCommandPayload,
  ManualPaymentPayload,
  MqttCommandAckResponse,
  CommandConfig,
  FirmwarePayload,
  ManualPaymentResponse,
} from "~/services/apis/device-commands-api.service";
import { DeviceCommandsApiService } from "~/services/apis/device-commands-api.service";
import type { ApiErrorResponse } from "~/types";

export const useDeviceCommands = () => {
  // Local state - command response
  const lastCommandResponse = ref<MqttCommandAckResponse | null>(null);

  // Loading states for each command type
  const isApplyingConfig = ref(false);
  const isRestarting = ref(false);
  const isUpdatingFirmware = ref(false);
  const isResettingConfig = ref(false);
  const isSendingCustomCommand = ref(false);
  const isSendingManualPayment = ref(false);

  // Response messages
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const deviceCommandsApi = new DeviceCommandsApiService();

  const clearMessages = () => {
    error.value = null;
    successMessage.value = null;
  };

  /**
   * Apply configuration to device
   * Note: Config is loaded from database on the backend
   */
  const applyConfig = async (
    deviceId: string
  ): Promise<MqttCommandAckResponse<CommandConfig> | undefined> => {
    try {
      isApplyingConfig.value = true;
      clearMessages();

      const response = await deviceCommandsApi.applyConfig(deviceId);

      if (response.success && response.data) {
        lastCommandResponse.value = response.data;
        successMessage.value =
          response.message || "ส่งคำสั่งการตั้งค่าไปยังอุปกรณ์สำเร็จ";
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message || "ไม่สามารถส่งคำสั่งการตั้งค่าไปยังอุปกรณ์ได้";
      throw err;
    } finally {
      isApplyingConfig.value = false;
    }
  };

  /**
   * Restart device
   */
  const restartDevice = async (
    deviceId: string,
    payload: RestartDevicePayload = { delay_seconds: 5 }
  ): Promise<MqttCommandAckResponse<unknown> | undefined> => {
    try {
      isRestarting.value = true;
      clearMessages();

      const response = await deviceCommandsApi.restartDevice(deviceId, payload);

      if (response.success && response.data) {
        lastCommandResponse.value = response.data;
        successMessage.value =
          response.message || "ส่งคำสั่งรีสตาร์ทอุปกรณ์สำเร็จ";
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message || "ไม่สามารถส่งคำสั่งรีสตาร์ทอุปกรณ์ได้";
      throw err;
    } finally {
      isRestarting.value = false;
    }
  };

  /**
   * Update firmware
   * Note: Firmware info is fetched from firmwares service on the backend
   * @param version - Optional firmware version (defaults to latest on backend)
   */
  const updateFirmware = async (
    deviceId: string,
    version?: string
  ): Promise<MqttCommandAckResponse<FirmwarePayload> | undefined> => {
    try {
      isUpdatingFirmware.value = true;
      clearMessages();

      const response = await deviceCommandsApi.updateFirmware(deviceId, version);

      if (response.success && response.data) {
        lastCommandResponse.value = response.data;
        successMessage.value =
          response.message || "ส่งคำสั่งอัพเดทเฟิร์มแวร์สำเร็จ";
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message || "ไม่สามารถส่งคำสั่งอัพเดทเฟิร์มแวร์ได้";
      throw err;
    } finally {
      isUpdatingFirmware.value = false;
    }
  };

  /**
   * Reset configuration
   */
  const resetConfig = async (
    deviceId: string
  ): Promise<MqttCommandAckResponse<CommandConfig> | undefined> => {
    try {
      isResettingConfig.value = true;
      clearMessages();

      const response = await deviceCommandsApi.resetConfig(deviceId);

      if (response.success && response.data) {
        lastCommandResponse.value = response.data;
        successMessage.value =
          response.message || "ส่งคำสั่งรีเซ็ตการตั้งค่าสำเร็จ";
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message || "ไม่สามารถส่งคำสั่งรีเซ็ตการตั้งค่าได้";
      throw err;
    } finally {
      isResettingConfig.value = false;
    }
  };

  /**
   * Send custom command
   */
  const sendCustomCommand = async (
    deviceId: string,
    payload: SendCustomCommandPayload
  ): Promise<MqttCommandAckResponse<unknown> | undefined> => {
    try {
      isSendingCustomCommand.value = true;
      clearMessages();

      const response = await deviceCommandsApi.sendCustomCommand(
        deviceId,
        payload
      );

      if (response.success && response.data) {
        lastCommandResponse.value = response.data;
        successMessage.value =
          response.message || "ส่งคำสั่งกำหนดเองไปยังอุปกรณ์สำเร็จ";
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message || "ไม่สามารถส่งคำสั่งกำหนดเองไปยังอุปกรณ์ได้";
      throw err;
    } finally {
      isSendingCustomCommand.value = false;
    }
  };

  /**
   * Send manual payment
   */
  const sendManualPayment = async (
    deviceId: string,
    payload: ManualPaymentPayload
  ): Promise<MqttCommandAckResponse<ManualPaymentResponse> | undefined> => {
    try {
      isSendingManualPayment.value = true;
      clearMessages();

      const response = await deviceCommandsApi.sendManualPayment(
        deviceId,
        payload
      );

      if (response.success && response.data) {
        lastCommandResponse.value = response.data;
        successMessage.value =
          response.message || "ส่งคำสั่งชำระเงินแบบแมนนวลสำเร็จ";
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message || "ไม่สามารถส่งคำสั่งชำระเงินแบบแมนนวลได้";
      throw err;
    } finally {
      isSendingManualPayment.value = false;
    }
  };

  /**
   * Reset state
   */
  const resetState = () => {
    lastCommandResponse.value = null;
    clearMessages();
  };

  return {
    // State
    lastCommandResponse: readonly(lastCommandResponse),

    // Loading states
    isApplyingConfig: readonly(isApplyingConfig),
    isRestarting: readonly(isRestarting),
    isUpdatingFirmware: readonly(isUpdatingFirmware),
    isResettingConfig: readonly(isResettingConfig),
    isSendingCustomCommand: readonly(isSendingCustomCommand),
    isSendingManualPayment: readonly(isSendingManualPayment),

    // Messages
    error: readonly(error),
    successMessage: readonly(successMessage),

    // Methods
    applyConfig,
    restartDevice,
    updateFirmware,
    resetConfig,
    sendCustomCommand,
    sendManualPayment,
    clearMessages,
    resetState,
  };
};
