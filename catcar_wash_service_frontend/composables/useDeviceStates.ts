import { ref, readonly } from "vue";
import type {
  DeviceStateResponseApi,
  PaginatedDeviceStatesResponse,
  SearchDeviceStatesRequest,
} from "~/services/apis/device-states-api.service";
import { DeviceStatesApiService } from "~/services/apis/device-states-api.service";
import type { ApiErrorResponse } from "~/types";

export const useDeviceStates = () => {
  // Local state - not global
  const deviceStates = ref<DeviceStateResponseApi[]>([]);
  const currentDeviceState = ref<DeviceStateResponseApi | null>(null);
  const currentSearchParams = ref<SearchDeviceStatesRequest>({
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "desc",
  });

  // Pagination info from API response
  const totalStates = ref(0);
  const totalPages = ref(1);

  // Loading State
  const isLoading = ref(false);
  const isSearching = ref(false);

  // Response Message
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const deviceStatesApi = new DeviceStatesApiService();

  const clearMessages = () => {
    error.value = null;
    successMessage.value = null;
  };

  const clearPagination = () => {
    totalStates.value = 0;
    totalPages.value = 1;
  };

  const searchDeviceStates = async (
    searchParams: SearchDeviceStatesRequest = {}
  ) => {
    try {
      isSearching.value = true;
      clearMessages();

      currentSearchParams.value = {
        ...currentSearchParams.value,
        ...searchParams,
      };

      const response = await deviceStatesApi.SearchDeviceStates(
        currentSearchParams.value
      );
      if (response.success && response.data) {
        const paginatedData: PaginatedDeviceStatesResponse = response.data;
        deviceStates.value = paginatedData.items || [];
        totalStates.value = paginatedData.total || 0;
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
      error.value = errorAxios.message || "ไม่สามารถค้นหาสถานะอุปกรณ์ได้";
      deviceStates.value = [];
      clearPagination();
    } finally {
      isSearching.value = false;
    }
  };

  const goToPage = async (page: number) => {
    await searchDeviceStates({ page });
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
    await searchDeviceStates({});
  };

  const resetState = () => {
    deviceStates.value = [];
    currentDeviceState.value = null;
    currentSearchParams.value = {};
    clearPagination();
    clearMessages();
  };

  return {
    deviceStates: readonly(deviceStates),
    currentDeviceState: readonly(currentDeviceState),
    currentSearchParams: readonly(currentSearchParams),

    totalStates: readonly(totalStates),
    totalPages: readonly(totalPages),

    isLoading: readonly(isLoading),
    isSearching: readonly(isSearching),

    error: readonly(error),
    successMessage: readonly(successMessage),

    searchDeviceStates,
    goToPage,
    nextPage,
    previousPage,
    refreshSearch,
    clearMessages,
    resetState,
  };
};
