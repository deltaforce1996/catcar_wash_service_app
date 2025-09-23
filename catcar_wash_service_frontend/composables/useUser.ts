import { ref } from "vue";
import type {
  UserResponseApi,
  PaginatedUserResponse,
  SearchUsersRequest,
  RegisterUserPayload,
  UpdateUserPayload,
} from "~/services/apis/user-api.service";
import { UserApiService as UserApi } from "~/services/apis/user-api.service";
import type { ApiErrorResponse } from "~/types";

export const useUser = () => {
  // Local state - not global
  const users = ref<UserResponseApi[]>([]);
  const currentUser = ref<UserResponseApi | null>(null);
  const currentSearchParams = ref<SearchUsersRequest>({
    page: 1,
    limit: 1,
    sort_by: "created_at",
    sort_order: "desc",
    exclude_device_counts: false,
  });

  // Pagination info from API response
  const totalUsers = ref(0);
  const totalPages = ref(1);

  // Loading State
  const isLoading = ref(false);
  const isSearching = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);

  // Response Message
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const userApi = new UserApi();

  const clearMessages = () => {
    error.value = null;
    successMessage.value = null;
  };

  const clearPagination = () => {
    totalUsers.value = 0;
    totalPages.value = 1;
  };

  const searchUsers = async (searchParams: SearchUsersRequest = {}) => {
    try {
      isSearching.value = true;
      clearMessages();

      currentSearchParams.value = {
        ...currentSearchParams.value,
        ...searchParams,
      };

      const response = await userApi.SearchUsers(currentSearchParams.value);
      if (response.success && response.data) {
        const paginatedData: PaginatedUserResponse = response.data;
        users.value = paginatedData.items || [];
        totalUsers.value = paginatedData.total || 0;
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
      error.value = errorAxios.message || "ไม่สามารถค้นหาผู้ใช้ได้";
      users.value = [];
      clearPagination();
    } finally {
      isSearching.value = false;
    }
  };

  const getUserById = async (id: string) => {
    try {
      isLoading.value = true;
      clearMessages();
      const response = await userApi.GetUserById(id);
      if (response.success && response.data) {
        currentUser.value = response.data;
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้";
      currentUser.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  const registerUser = async (userData: RegisterUserPayload) => {
    try {
      isCreating.value = true;
      clearMessages();
      const response = await userApi.RegisterUser(userData);
      if (response.success && response.data) {
        successMessage.value = response.message || "สร้างบัญชีผู้ใช้สำเร็จ";
        await clearFiltersAndSearch();
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถสร้างบัญชีผู้ใช้ได้";
      throw err;
    } finally {
      isCreating.value = false;
    }
  };

  const updateUserById = async (id: string, userData: UpdateUserPayload) => {
    try {
      isUpdating.value = true;
      clearMessages();
      const response = await userApi.UpdateUserById(id, userData);
      if (response.success && response.data) {
        if (currentUser.value?.id === id) {
          currentUser.value = response.data;
        }
        const userIndex = users.value.findIndex((user) => user.id === id);
        if (userIndex !== -1) {
          users.value[userIndex] = response.data;
        }
        successMessage.value = response.message || "อัปเดตข้อมูลผู้ใช้สำเร็จ";
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้";
      throw err;
    } finally {
      isUpdating.value = false;
    }
  };

  const goToPage = async (page: number) => {
    await searchUsers({ page });
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
    await searchUsers({});
  };

  const clearFiltersAndSearch = async () => {
    currentSearchParams.value = {
      page: 1,
      limit: 1,
      sort_by: "created_at",
      sort_order: "desc",
      exclude_device_counts: false,
    };
    await searchUsers({});
  };

  const resetState = () => {
    users.value = [];
    currentUser.value = null;
    currentSearchParams.value = {};
    clearPagination();
    clearMessages();
  };

  return {
    users: readonly(users),
    currentUser: readonly(currentUser),
    currentSearchParams: readonly(currentSearchParams),

    totalUsers: readonly(totalUsers),
    totalPages: readonly(totalPages),

    isLoading: readonly(isLoading),
    isSearching: readonly(isSearching),
    isCreating: readonly(isCreating),
    isUpdating: readonly(isUpdating),

    error: readonly(error),
    successMessage: readonly(successMessage),

    searchUsers,
    getUserById,
    registerUser,
    updateUserById,
    goToPage,
    nextPage,
    previousPage,
    refreshSearch,
    clearMessages,
    resetState,
  };
};
