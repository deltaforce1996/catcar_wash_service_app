import { ref } from "vue";
import type {
  EmpResponseApi,
  PaginatedEmpResponse,
  SearchEmpsRequest,
  CreateEmpPayload,
  UpdateEmpPayload,
} from "~/services/apis/emp-api.service";
import { EmpApiService as EmpApi } from "~/services/apis/emp-api.service";
import type { ApiErrorResponse } from "~/types";

export const useEmployee = () => {
  // Local state - not global
  const employees = ref<EmpResponseApi[]>([]);
  const currentEmployee = ref<EmpResponseApi | null>(null);
  const currentSearchParams = ref<SearchEmpsRequest>({
    page: 1,
    limit: 1,
    sort_by: "created_at",
    sort_order: "desc",
  });

  // Pagination info from API response
  const totalEmployees = ref(0);
  const totalPages = ref(1);

  // Loading State
  const isLoading = ref(false);
  const isSearching = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);

  // Response Message
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const empApi = new EmpApi();

  const clearMessages = () => {
    error.value = null;
    successMessage.value = null;
  };

  const clearPagination = () => {
    totalEmployees.value = 0;
    totalPages.value = 1;
  };

  const searchEmployees = async (searchParams: SearchEmpsRequest = {}) => {
    try {
      isSearching.value = true;
      clearMessages();

      currentSearchParams.value = {
        ...currentSearchParams.value,
        ...searchParams,
      };

      const response = await empApi.SearchEmps(currentSearchParams.value);
      if (response.success && response.data) {
        const paginatedData: PaginatedEmpResponse = response.data;
        employees.value = paginatedData.items || [];
        totalEmployees.value = paginatedData.total || 0;
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
      error.value = errorAxios.message || "ไม่สามารถค้นหาพนักงานได้";
      employees.value = [];
      clearPagination();
    } finally {
      isSearching.value = false;
    }
  };

  const getEmployeeById = async (id: string) => {
    try {
      isLoading.value = true;
      clearMessages();
      const response = await empApi.GetEmpById(id);
      if (response.success && response.data) {
        currentEmployee.value = response.data;
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถดึงข้อมูลพนักงานได้";
      currentEmployee.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  const registerEmployee = async (empData: CreateEmpPayload) => {
    try {
      isCreating.value = true;
      clearMessages();
      const response = await empApi.RegisterEmp(empData);
      if (response.success && response.data) {
        successMessage.value = response.message || "สร้างบัญชีพนักงานสำเร็จ";
        await clearFiltersAndSearch();
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถสร้างบัญชีพนักงานได้";
      throw err;
    } finally {
      isCreating.value = false;
    }
  };

  const updateEmployeeById = async (id: string, empData: UpdateEmpPayload) => {
    try {
      isUpdating.value = true;
      clearMessages();
      const response = await empApi.UpdateEmpById(id, empData);
      if (response.success && response.data) {
        if (currentEmployee.value?.id === id) {
          currentEmployee.value = response.data;
        }
        const empIndex = employees.value.findIndex((emp) => emp.id === id);
        if (empIndex !== -1) {
          employees.value[empIndex] = response.data;
        }
        successMessage.value = response.message || "อัปเดตข้อมูลพนักงานสำเร็จ";
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      error.value = errorAxios.message || "ไม่สามารถอัปเดตข้อมูลพนักงานได้";
      throw err;
    } finally {
      isUpdating.value = false;
    }
  };

  const goToPage = async (page: number) => {
    await searchEmployees({ page });
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
    await searchEmployees({});
  };

  const clearFiltersAndSearch = async () => {
    currentSearchParams.value = {
      page: 1,
      limit: 10,
      sort_by: "created_at",
      sort_order: "desc",
    };
    await searchEmployees({});
  };

  const resetState = () => {
    employees.value = [];
    currentEmployee.value = null;
    currentSearchParams.value = {};
    clearPagination();
    clearMessages();
  };

  return {
    employees: readonly(employees),
    currentEmployee: readonly(currentEmployee),
    currentSearchParams: readonly(currentSearchParams),

    totalEmployees: readonly(totalEmployees),
    totalPages: readonly(totalPages),

    isLoading: readonly(isLoading),
    isSearching: readonly(isSearching),
    isCreating: readonly(isCreating),
    isUpdating: readonly(isUpdating),

    error: readonly(error),
    successMessage: readonly(successMessage),

    searchEmployees,
    getEmployeeById,
    registerEmployee,
    updateEmployeeById,
    goToPage,
    nextPage,
    previousPage,
    refreshSearch,
    clearMessages,
    resetState,
  };
};
