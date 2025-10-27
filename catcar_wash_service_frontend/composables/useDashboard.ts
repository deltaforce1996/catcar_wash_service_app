import { ref, readonly, computed } from "vue";
import type {
  DashboardFilterRequest,
  DashboardSummaryResponse,
} from "~/services/apis/dashboard-api.service";
import { DashboardApiService } from "~/services/apis/dashboard-api.service";
import type { ApiErrorResponse } from "~/types";

/**
 * Helper function to convert month number to Thai month abbreviation
 * @param month - Month string in format "01" to "12"
 * @returns Thai month abbreviation
 */
const getThaiMonthLabel = (month: string): string => {
  const thaiMonths = [
    "ม.ค.", // มกราคม
    "ก.พ.", // กุมภาพันธ์
    "มี.ค.", // มีนาคม
    "เม.ย.", // เมษายน
    "พ.ค.", // พฤษภาคม
    "มิ.ย.", // มิถุนายน
    "ก.ค.", // กรกฎาคม
    "ส.ค.", // สิงหาคม
    "ก.ย.", // กันยายน
    "ต.ค.", // ตุลาคม
    "พ.ย.", // พฤศจิกายน
    "ธ.ค.", // ธันวาคม
  ];

  const monthIndex = parseInt(month, 10) - 1;
  return thaiMonths[monthIndex] || month;
};

/**
 * Helper function to convert hour string to time label
 * @param hour - Hour string in format "0" to "23"
 * @returns Time label in format "HH:00"
 */
const getHourLabel = (hour: string): string => {
  const hourNum = parseInt(hour, 10);
  return `${hourNum.toString().padStart(2, "0")}:00`;
};

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useDashboard = () => {
  // Local state - not global
  const dashboardSummary = ref<DashboardSummaryResponse | null>(null);
  const currentFilter = ref<DashboardFilterRequest>({
    date: getTodayDate(),
    include_charts: true,
  });

  // Loading State
  const isLoading = ref(false);

  // Response Message
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const dashboardApi = new DashboardApiService();

  const clearMessages = () => {
    error.value = null;
    successMessage.value = null;
  };

  const resetState = () => {
    dashboardSummary.value = null;
    currentFilter.value = {
      date: getTodayDate(),
      include_charts: true,
    };
    clearMessages();
  };

  /**
   * Computed property for monthly data transformation
   * Returns formatted data with Thai month labels for charts
   */
  const monthlyData = computed(() => {
    if (!dashboardSummary.value?.monthly) return null;

    const data = dashboardSummary.value.monthly;
    return {
      value: data.revenue,
      trend: data.change,
      chartData: data.data?.map((d) => d.amount) || [],
      chartLabels: data.data?.map((d) => getThaiMonthLabel(d.month || "")) || [],
    };
  });

  /**
   * Computed property for daily data transformation
   * Returns formatted data with day numbers for charts
   */
  const dailyData = computed(() => {
    if (!dashboardSummary.value?.daily) return null;

    const data = dashboardSummary.value.daily;
    return {
      value: data.revenue,
      trend: data.change,
      chartData: data.data?.map((d) => d.amount) || [],
      chartLabels: data.data?.map((d) => d.day || "") || [],
    };
  });

  /**
   * Computed property for hourly data transformation
   * Returns formatted data with time labels (HH:00) for charts
   */
  const hourlyData = computed(() => {
    if (!dashboardSummary.value?.hourly) return null;

    const data = dashboardSummary.value.hourly;
    return {
      value: data.revenue,
      trend: data.change,
      chartData: data.data?.map((d) => d.amount) || [],
      chartLabels: data.data?.map((d) => getHourLabel(d.hour || "")) || [],
    };
  });

  /**
   * Fetch dashboard summary data with optional filter
   * @param filter - Optional filter parameters to override current filter
   */
  const fetchDashboardSummary = async (
    filter?: DashboardFilterRequest
  ): Promise<void> => {
    try {
      isLoading.value = true;
      clearMessages();

      // Update current filter if new filter is provided
      if (filter) {
        currentFilter.value = {
          ...currentFilter.value,
          ...filter,
        };
      }

      const response = await dashboardApi.GetDashboardSummary(
        currentFilter.value
      );

      if (response.success && response.data) {
        dashboardSummary.value = response.data;
        successMessage.value = "ดึงข้อมูลแดชบอร์ดสำเร็จ";
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถดึงข้อมูลแดชบอร์ดได้";
      dashboardSummary.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update filter and refetch dashboard data
   * @param filter - Partial filter parameters to update
   */
  const updateFilter = async (
    filter: Partial<DashboardFilterRequest>
  ): Promise<void> => {
    currentFilter.value = {
      ...currentFilter.value,
      ...filter,
    };
    await fetchDashboardSummary();
  };

  return {
    dashboardSummary: readonly(dashboardSummary),
    currentFilter: readonly(currentFilter),
    isLoading: readonly(isLoading),
    error: readonly(error),
    successMessage: readonly(successMessage),

    monthlyData,
    dailyData,
    hourlyData,

    fetchDashboardSummary,
    updateFilter,
    clearMessages,
    resetState,
  };
};
