import { ref } from "vue";
import type {
  PromotionResponseApi,
  SearchPromotionsRequest,
  CreatePromotionPayload,
  UpdatePromotionPayload,
  PaginatedPromotionResponse,
  ApiErrorResponse,
} from "~/types";
import { PromotionApiService } from "~/services/apis/promotion-api.service";

export const usePromotion = () => {
  // Local state
  const promotions = ref<PromotionResponseApi[]>([]);
  const currentPromotion = ref<PromotionResponseApi | null>(null);
  const currentSearchParams = ref<SearchPromotionsRequest>({
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "desc",
  });

  // Pagination info
  const totalPromotions = ref(0);
  const totalPages = ref(1);

  // Loading states
  const isLoading = ref(false);
  const isSearching = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);

  // Response messages
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const promotionApi = new PromotionApiService();

  const clearMessages = () => {
    error.value = null;
    successMessage.value = null;
  };

  const clearPagination = () => {
    totalPromotions.value = 0;
    totalPages.value = 1;
  };

  const searchPromotions = async (searchParams: SearchPromotionsRequest = {}) => {
    try {
      isSearching.value = true;
      clearMessages();

      currentSearchParams.value = {
        ...currentSearchParams.value,
        ...searchParams,
      };

      const response = await promotionApi.SearchPromotions(currentSearchParams.value);
      if (response.success && response.data) {
        const paginatedData: PaginatedPromotionResponse = response.data;
        promotions.value = paginatedData.items || [];
        totalPromotions.value = paginatedData.total || 0;
        totalPages.value = paginatedData.totalPages || 1;
        currentSearchParams.value = {
          ...currentSearchParams.value,
          page: paginatedData.page || 1,
          limit: paginatedData.limit || 10,
        };
        successMessage.value = response.message;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถค้นหาโปรโมชั่นได้";
      promotions.value = [];
      clearPagination();
    } finally {
      isSearching.value = false;
    }
  };

  const getPromotionById = async (id: string) => {
    try {
      isLoading.value = true;
      clearMessages();
      const response = await promotionApi.GetPromotionById(id);
      if (response.success && response.data) {
        currentPromotion.value = response.data;
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถดึงข้อมูลโปรโมชั่นได้";
      currentPromotion.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  const createPromotion = async (promotionData: CreatePromotionPayload) => {
    try {
      isCreating.value = true;
      clearMessages();
      const response = await promotionApi.CreatePromotion(promotionData);
      if (response.success && response.data) {
        successMessage.value = response.message || "สร้างโปรโมชั่นสำเร็จ";
        await clearFiltersAndSearch();
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถสร้างโปรโมชั่นได้";
      throw err;
    } finally {
      isCreating.value = false;
    }
  };

  const updatePromotionById = async (id: string, promotionData: UpdatePromotionPayload) => {
    try {
      isUpdating.value = true;
      clearMessages();
      const response = await promotionApi.UpdatePromotion(id, promotionData);
      if (response.success && response.data) {
        if (currentPromotion.value?.id === id) {
          currentPromotion.value = response.data;
        }
        const promoIndex = promotions.value.findIndex((promo) => promo.id === id);
        if (promoIndex !== -1) {
          promotions.value[promoIndex] = response.data;
        }
        successMessage.value = response.message || "อัปเดตโปรโมชั่นสำเร็จ";
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถอัปเดตโปรโมชั่นได้";
      throw err;
    } finally {
      isUpdating.value = false;
    }
  };

  const goToPage = async (page: number) => {
    await searchPromotions({ page });
  };

  const nextPage = async () => {
    if (currentSearchParams.value.page! < totalPages.value) {
      await goToPage(currentSearchParams.value.page! + 1);
    }
  };

  const previousPage = async () => {
    if (currentSearchParams.value.page! > 1) {
      await goToPage(currentSearchParams.value.page! - 1);
    }
  };

  const clearFiltersAndSearch = async () => {
    currentSearchParams.value = {
      page: 1,
      limit: 10,
      sort_by: "created_at",
      sort_order: "desc",
    };
    await searchPromotions();
  };

  return {
    // State
    promotions,
    currentPromotion,
    currentSearchParams,
    totalPromotions,
    totalPages,
    // Loading states
    isLoading,
    isSearching,
    isCreating,
    isUpdating,
    // Messages
    error,
    successMessage,
    // Methods
    searchPromotions,
    getPromotionById,
    createPromotion,
    updatePromotionById,
    goToPage,
    nextPage,
    previousPage,
    clearFiltersAndSearch,
    clearMessages,
  };
};
