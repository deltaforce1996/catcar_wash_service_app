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

  // Versions state
  const carwashVersions = ref<string[]>([]);
  const helmetVersions = ref<string[]>([]);
  const selectedCarwashVersion = ref<string>("");
  const selectedHelmetVersion = ref<string>("");

  // Loading states
  const isLoadingCarwash = ref(false);
  const isLoadingHelmet = ref(false);
  const isLoadingCarwashVersions = ref(false);
  const isLoadingHelmetVersions = ref(false);
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
   * Get all carwash firmware versions
   */
  const getAllCarwashVersions = async () => {
    try {
      isLoadingCarwashVersions.value = true;
      clearMessages();

      const response = await firmwareApi.getAllVersions("carwash");

      if (response.success && response.data) {
        carwashVersions.value = response.data.versions;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message || "ไม่สามารถดึงรายการ version ของ carwash ได้";
      carwashVersions.value = [];
    } finally {
      isLoadingCarwashVersions.value = false;
    }
  };

  /**
   * Get all helmet firmware versions
   */
  const getAllHelmetVersions = async () => {
    try {
      isLoadingHelmetVersions.value = true;
      clearMessages();

      const response = await firmwareApi.getAllVersions("helmet");

      if (response.success && response.data) {
        helmetVersions.value = response.data.versions;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message || "ไม่สามารถดึงรายการ version ของ helmet ได้";
      helmetVersions.value = [];
    } finally {
      isLoadingHelmetVersions.value = false;
    }
  };

  /**
   * Get carwash firmware by specific version
   */
  const getCarwashFirmwareByVersion = async (version: string) => {
    try {
      isLoadingCarwash.value = true;
      clearMessages();

      const response = await firmwareApi.getFirmwareByVersion("carwash", version);

      if (response.success && response.data) {
        carwashFirmware.value = response.data;
        selectedCarwashVersion.value = version;
        successMessage.value = response.message;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message ||
        `ไม่สามารถดึงข้อมูล firmware carwash version ${version} ได้`;
      carwashFirmware.value = null;
    } finally {
      isLoadingCarwash.value = false;
    }
  };

  /**
   * Get helmet firmware by specific version
   */
  const getHelmetFirmwareByVersion = async (version: string) => {
    try {
      isLoadingHelmet.value = true;
      clearMessages();

      const response = await firmwareApi.getFirmwareByVersion("helmet", version);

      if (response.success && response.data) {
        helmetFirmware.value = response.data;
        selectedHelmetVersion.value = version;
        successMessage.value = response.message;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message ||
        `ไม่สามารถดึงข้อมูล firmware helmet version ${version} ได้`;
      helmetFirmware.value = null;
    } finally {
      isLoadingHelmet.value = false;
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
    carwashVersions: readonly(carwashVersions),
    helmetVersions: readonly(helmetVersions),
    selectedCarwashVersion: readonly(selectedCarwashVersion),
    selectedHelmetVersion: readonly(selectedHelmetVersion),
    isLoadingCarwash: readonly(isLoadingCarwash),
    isLoadingHelmet: readonly(isLoadingHelmet),
    isLoadingCarwashVersions: readonly(isLoadingCarwashVersions),
    isLoadingHelmetVersions: readonly(isLoadingHelmetVersions),
    isUploading: readonly(isUploading),
    error: readonly(error),
    successMessage: readonly(successMessage),

    // Methods
    getLatestCarwashFirmware,
    getLatestHelmetFirmware,
    getAllCarwashVersions,
    getAllHelmetVersions,
    getCarwashFirmwareByVersion,
    getHelmetFirmwareByVersion,
    uploadFirmware,
    clearMessages,
    formatFileSize,
  };
};
