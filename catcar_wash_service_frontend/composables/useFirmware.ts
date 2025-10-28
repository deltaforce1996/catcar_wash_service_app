import { ref, readonly } from "vue";
import type { ApiErrorResponse } from "~/types";
import type {
  FirmwareLatestResponse,
  UploadFirmwareResponse,
  FirmwareType,
} from "~/types/firmware.type";
import { FirmwareApiService } from "~/services/apis/firmware-api.service";

export const useFirmware = () => {
  // Service instance
  const firmwareApi = new FirmwareApiService();

  // State
  const carwashFirmware = ref<FirmwareLatestResponse | null>(null);
  const helmetFirmware = ref<FirmwareLatestResponse | null>(null);

  // Loading states
  const isLoadingCarwash = ref(false);
  const isLoadingHelmet = ref(false);
  const isUploading = ref(false);

  // Messages
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const clearMessages = () => {
    error.value = null;
    successMessage.value = null;
  };

  /**
   * Get latest carwash firmware
   */
  const getLatestCarwashFirmware = async () => {
    try {
      isLoadingCarwash.value = true;
      clearMessages();

      const response = await firmwareApi.getLatestFirmware("carwash");

      if (response.success && response.data) {
        carwashFirmware.value = response.data;
        successMessage.value = response.message;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message || "ไม่สามารถดึงข้อมูล firmware carwash ได้";
      carwashFirmware.value = null;
    } finally {
      isLoadingCarwash.value = false;
    }
  };

  /**
   * Get latest helmet firmware
   */
  const getLatestHelmetFirmware = async () => {
    try {
      isLoadingHelmet.value = true;
      clearMessages();

      const response = await firmwareApi.getLatestFirmware("helmet");

      if (response.success && response.data) {
        helmetFirmware.value = response.data;
        successMessage.value = response.message;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message || "ไม่สามารถดึงข้อมูล firmware helmet ได้";
      helmetFirmware.value = null;
    } finally {
      isLoadingHelmet.value = false;
    }
  };

  /**
   * Upload firmware files
   */
  const uploadFirmware = async (
    files: File[],
    type: FirmwareType
  ): Promise<UploadFirmwareResponse | null> => {
    try {
      isUploading.value = true;
      clearMessages();

      let response;
      if (type === "carwash") {
        response = await firmwareApi.uploadCarwashFirmware(files);
      } else {
        response = await firmwareApi.uploadHelmetFirmware(files);
      }

      if (response.success && response.data) {
        successMessage.value = response.message || "อัพโหลดสำเร็จ";

        // Refresh latest firmware data
        if (type === "carwash") {
          await getLatestCarwashFirmware();
        } else {
          await getLatestHelmetFirmware();
        }

        return response.data;
      }

      return null;
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถอัพโหลด firmware ได้";
      return null;
    } finally {
      isUploading.value = false;
    }
  };

  /**
   * Format file size to human readable
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return {
    // State
    carwashFirmware: readonly(carwashFirmware),
    helmetFirmware: readonly(helmetFirmware),
    isLoadingCarwash: readonly(isLoadingCarwash),
    isLoadingHelmet: readonly(isLoadingHelmet),
    isUploading: readonly(isUploading),
    error: readonly(error),
    successMessage: readonly(successMessage),

    // Methods
    getLatestCarwashFirmware,
    getLatestHelmetFirmware,
    uploadFirmware,
    clearMessages,
    formatFileSize,
  };
};
