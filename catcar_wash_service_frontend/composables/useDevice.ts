import { ref } from "vue";
import type {
  DeviceResponseApi,
  PaginatedDeviceResponse,
  SearchDevicesRequest,
  CreateDevicePayload,
  UpdateDeviceBasicPayload,
  UpdateDeviceConfigsPayload,
  SetDeviceStatePayload,
} from "~/services/apis/device-api.service";
import { DeviceApiService as DeviceApi } from "~/services/apis/device-api.service";
import type { ApiErrorResponse } from "~/types";

export const useDevice = () => {
  // Local state - not global
  const devices = ref<DeviceResponseApi[]>([]);
  const currentDevice = ref<DeviceResponseApi | null>(null);
  const currentSearchParams = ref<SearchDevicesRequest>({
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "desc",
  });

  // Pagination info from API response
  const totalDevices = ref(0);
  const totalPages = ref(1);

  // Loading State
  const isLoading = ref(false);
  const isSearching = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);

  // Response Message
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const deviceApi = new DeviceApi();

  const clearMessages = () => {
    error.value = null;
    successMessage.value = null;
  };

  const clearPagination = () => {
    totalDevices.value = 0;
    totalPages.value = 1;
  };

  const searchDevices = async (searchParams: SearchDevicesRequest = {}) => {
    try {
      isSearching.value = true;
      clearMessages();

      currentSearchParams.value = {
        ...currentSearchParams.value,
        ...searchParams,
      };

      const response = await deviceApi.SearchDevices(currentSearchParams.value);
      if (response.success && response.data) {
        const paginatedData: PaginatedDeviceResponse = response.data;
        devices.value = paginatedData.items || [];
        totalDevices.value = paginatedData.total || 0;
        totalPages.value = paginatedData.totalPages || 1;
        currentSearchParams.value = {
          ...currentSearchParams.value,
          page: paginatedData.page || 1,
          limit: paginatedData.limit || 10,
        };
        successMessage.value = `${response.message}`;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถค้นหาอุปกรณ์ได้";
      devices.value = [];
      clearPagination();
    } finally {
      isSearching.value = false;
    }
  };

  const getDeviceById = async (id: string) => {
    try {
      isLoading.value = true;
      clearMessages();
      const response = await deviceApi.GetDeviceById(id);
      if (response.success && response.data) {
        currentDevice.value = response.data;
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถดึงข้อมูลอุปกรณ์ได้";
      currentDevice.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  const createDevice = async (deviceData: CreateDevicePayload) => {
    try {
      isCreating.value = true;
      clearMessages();
      const response = await deviceApi.CreateDevice(deviceData);
      if (response.success && response.data) {
        successMessage.value = response.message || "สร้างอุปกรณ์สำเร็จ";
        await clearFiltersAndSearch();
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถสร้างอุปกรณ์ได้";
      throw err;
    } finally {
      isCreating.value = false;
    }
  };

  const updateDeviceBasic = async (
    id: string,
    deviceData: UpdateDeviceBasicPayload
  ) => {
    try {
      isUpdating.value = true;
      clearMessages();
      const response = await deviceApi.UpdateDeviceBasicById(id, deviceData);
      if (response.success && response.data) {
        if (currentDevice.value?.id === id) {
          currentDevice.value = response.data;
        }
        const deviceIndex = devices.value.findIndex(
          (device) => device.id === id
        );
        if (deviceIndex !== -1) {
          devices.value[deviceIndex] = response.data;
        }
        successMessage.value =
          response.message || "อัปเดตข้อมูลอุปกรณ์สำเร็จ";
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message || "ไม่สามารถอัปเดตข้อมูลอุปกรณ์ได้";
      throw err;
    } finally {
      isUpdating.value = false;
    }
  };

  const updateDeviceConfigs = async (
    id: string,
    configData: UpdateDeviceConfigsPayload
  ) => {
    try {
      isUpdating.value = true;
      clearMessages();
      const response = await deviceApi.UpdateDeviceConfigsById(id, configData);
      if (response.success && response.data) {
        if (currentDevice.value?.id === id) {
          currentDevice.value = response.data;
        }
        const deviceIndex = devices.value.findIndex(
          (device) => device.id === id
        );
        if (deviceIndex !== -1) {
          devices.value[deviceIndex] = response.data;
        }
        successMessage.value =
          response.message || "อัปเดตการตั้งค่าอุปกรณ์สำเร็จ";
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message || "ไม่สามารถอัปเดตการตั้งค่าอุปกรณ์ได้";
      throw err;
    } finally {
      isUpdating.value = false;
    }
  };

  const setDeviceStatus = async (
    id: string,
    statusData: SetDeviceStatePayload
  ) => {
    try {
      isUpdating.value = true;
      clearMessages();
      const response = await deviceApi.SetDeviceStatus(id, statusData);
      if (response.success) {
        // Refresh the device data to get updated status
        await getDeviceById(id);
        // Also update in the devices list if present
        const deviceIndex = devices.value.findIndex(
          (device) => device.id === id
        );
        if (deviceIndex !== -1 && currentDevice.value) {
          devices.value[deviceIndex] = currentDevice.value;
        }
        successMessage.value =
          response.message || "อัปเดตสถานะอุปกรณ์สำเร็จ";
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value =
        errorAxios.message || "ไม่สามารถอัปเดตสถานะอุปกรณ์ได้";
      throw err;
    } finally {
      isUpdating.value = false;
    }
  };

  const goToPage = async (page: number) => {
    await searchDevices({ page });
  };

  const nextPage = async () => {
    const currentPage = currentSearchParams.value.page || 1;
    if (currentPage < totalPages.value) {
      await goToPage(currentPage + 1);
    }
  };

  const previousPage = async () => {
    const currentPage = currentSearchParams.value.page || 1;
    if (currentPage > 1) {
      await goToPage(currentPage - 1);
    }
  };

  const refreshSearch = async () => {
    await searchDevices({});
  };

  const clearFiltersAndSearch = async () => {
    currentSearchParams.value = {
      page: 1,
      limit: 10,
      sort_by: "created_at",
      sort_order: "desc",
    };
    await searchDevices({});
  };

  const resetState = () => {
    devices.value = [];
    currentDevice.value = null;
    currentSearchParams.value = {};
    clearPagination();
    clearMessages();
  };

  return {
    devices: readonly(devices),
    currentDevice: readonly(currentDevice),
    currentSearchParams: readonly(currentSearchParams),

    totalDevices: readonly(totalDevices),
    totalPages: readonly(totalPages),

    isLoading: readonly(isLoading),
    isSearching: readonly(isSearching),
    isCreating: readonly(isCreating),
    isUpdating: readonly(isUpdating),

    error: readonly(error),
    successMessage: readonly(successMessage),

    searchDevices,
    getDeviceById,
    createDevice,
    updateDeviceBasic,
    updateDeviceConfigs,
    setDeviceStatus,
    goToPage,
    nextPage,
    previousPage,
    refreshSearch,
    clearMessages,
    resetState,
  };
};
