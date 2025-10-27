import { ref, readonly } from "vue";
import type {
  DeviceEventLogResponseApi,
  PaginatedDeviceEventLogsResponse,
  SearchDeviceEventLogsRequest,
} from "~/services/apis/device-event-logs-api.service";
import { DeviceEventLogsApiService } from "~/services/apis/device-event-logs-api.service";
import type { ApiErrorResponse } from "~/types";

export const useDeviceEventLogs = () => {
  // Get auth state to check if user is USER permission
  const { isUser, user } = useAuth();

  // Local state - not global
  const eventLogs = ref<DeviceEventLogResponseApi[]>([]);
  const currentEventLog = ref<DeviceEventLogResponseApi | null>(null);
  const currentSearchParams = ref<SearchDeviceEventLogsRequest>({
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "desc",
  });

  // Pagination info from API response
  const totalLogs = ref(0);
  const totalPages = ref(1);

  // Loading State
  const isLoading = ref(false);
  const isSearching = ref(false);

  // Response Message
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const eventLogsApi = new DeviceEventLogsApiService();

  const clearMessages = () => {
    error.value = null;
    successMessage.value = null;
  };

  const clearPagination = () => {
    totalLogs.value = 0;
    totalPages.value = 1;
  };

  const searchEventLogs = async (
    searchParams: SearchDeviceEventLogsRequest = {}
  ) => {
    try {
      isSearching.value = true;
      clearMessages();

      currentSearchParams.value = {
        ...currentSearchParams.value,
        ...searchParams,
      };

      // Prepare request params
      const requestParams: SearchDeviceEventLogsRequest = {
        ...currentSearchParams.value,
      };

      // Automatically add user_id to query object for USER permission users
      if (isUser.value && user.value?.id) {
        requestParams.query = {
          ...requestParams.query,
          user_id: user.value.id,
        };
      }

      const response = await eventLogsApi.SearchDeviceEventLogs(requestParams);
      if (response.success && response.data) {
        const paginatedData: PaginatedDeviceEventLogsResponse = response.data;
        eventLogs.value = paginatedData.items || [];
        totalLogs.value = paginatedData.total || 0;
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
      error.value = errorAxios.message || "ไม่สามารถค้นหาบันทึกเหตุการณ์ได้";
      eventLogs.value = [];
      clearPagination();
    } finally {
      isSearching.value = false;
    }
  };

  const goToPage = async (page: number) => {
    await searchEventLogs({ page });
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
    await searchEventLogs({});
  };

  const resetState = () => {
    eventLogs.value = [];
    currentEventLog.value = null;
    currentSearchParams.value = {};
    clearPagination();
    clearMessages();
  };

  return {
    eventLogs: readonly(eventLogs),
    currentEventLog: readonly(currentEventLog),
    currentSearchParams: readonly(currentSearchParams),

    totalLogs: readonly(totalLogs),
    totalPages: readonly(totalPages),

    isLoading: readonly(isLoading),
    isSearching: readonly(isSearching),

    error: readonly(error),
    successMessage: readonly(successMessage),

    searchEventLogs,
    goToPage,
    nextPage,
    previousPage,
    refreshSearch,
    clearMessages,
    resetState,
  };
};
