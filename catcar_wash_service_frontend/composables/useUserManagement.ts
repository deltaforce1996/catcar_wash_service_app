import { ref, computed } from "vue";
import type { EnumUserStatus } from "~/types";

// Mock data type definitions
type UserResponseApi = {
  id: string;
  fullname: string;
  custom_name?: string;
  email: string;
  phone: string;
  address: string;
  status: EnumUserStatus;
  permission: {
    name: string;
  };
  device_counts?: {
    total: number;
    active: number;
    inactive: number;
  };
  created_at: string;
  updated_at: string;
};

type SearchUsersRequest = {
  page: number;
  limit: number;
  exclude_device_counts: boolean;
  query?: string;
};

interface UseUserManagementOptions {
  autoFetch?: boolean;
  defaultPageSize?: number;
}

// Mock data from user-list-response.json
const mockUsers: UserResponseApi[] = [
  {
    id: "cmfdx1e8l000azs30mrb4cmdh",
    fullname: "นางสาวสมหญิง รักดี",
    email: "user2@catcarwash.com",
    phone: "+66845678901",
    address: "789 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพมหานคร 10110",
    custom_name: "ลูกค้าธุรกิจ",
    status: "ACTIVE" as EnumUserStatus,
    permission: { name: "USER" },
    device_counts: { total: 4, active: 3, inactive: 1 },
    created_at: "2025-09-10 18:48:17",
    updated_at: "2025-09-10 18:48:17"
  },
  {
    id: "cmfdx1e8h0008zs300ov04roq",
    fullname: "นายสมชาย ใจดี",
    email: "user@catcarwash.com",
    phone: "+66834567890",
    address: "123/45 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900",
    custom_name: "ลูกค้าประจำ VIP",
    status: "ACTIVE" as EnumUserStatus,
    permission: { name: "USER" },
    device_counts: { total: 3, active: 2, inactive: 1 },
    created_at: "2025-09-10 18:48:17",
    updated_at: "2025-09-10 18:48:17"
  }
];

export const useUserManagement = (options: UseUserManagementOptions = {}) => {
  const { autoFetch = true, defaultPageSize = 10 } = options;

  // State
  const users = ref<UserResponseApi[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(defaultPageSize);

  // Search and filter state
  const searchQuery = ref("");
  const statusFilter = ref<EnumUserStatus[]>([]);
  const permissionFilter = ref<string[]>([]);

  // Temporary filter state (for pending changes)
  const tempSearchQuery = ref("");
  const tempStatusFilter = ref<EnumUserStatus[]>([]);
  const tempPermissionFilter = ref<string[]>([]);

  // Computed properties
  const hasActiveFilters = computed(() => {
    return (
      searchQuery.value.trim() !== "" ||
      statusFilter.value.length > 0 ||
      permissionFilter.value.length > 0
    );
  });

  const hasFilterChanges = computed(() => {
    return (
      tempSearchQuery.value !== searchQuery.value ||
      JSON.stringify([...tempStatusFilter.value].sort()) !==
        JSON.stringify([...statusFilter.value].sort()) ||
      JSON.stringify([...tempPermissionFilter.value].sort()) !==
        JSON.stringify([...permissionFilter.value].sort())
    );
  });

  const activeFilterCount = computed(() => {
    let count = 0;
    if (searchQuery.value.trim() !== "") count++;
    if (statusFilter.value.length > 0) count++;
    if (permissionFilter.value.length > 0) count++;
    return count;
  });

  // Build search request parameters
  const buildSearchParams = (): SearchUsersRequest => {
    const params: SearchUsersRequest = {
      page: currentPage.value,
      limit: pageSize.value,
      exclude_device_counts: false,
    };

    if (searchQuery.value.trim()) {
      params.query = searchQuery.value.trim();
    }

    return params;
  };

  // Mock fetch users with simulated delay
  const fetchUsers = async () => {
    try {
      loading.value = true;
      error.value = null;

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      let filteredData = [...mockUsers];

      // Apply search query
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        filteredData = filteredData.filter(user =>
          user.fullname.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phone.includes(query) ||
          (user.custom_name && user.custom_name.toLowerCase().includes(query))
        );
      }

      // Update users and total count
      users.value = filteredData;
      total.value = filteredData.length;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า";
      console.error("Error fetching users:", err);
    } finally {
      loading.value = false;
    }
  };

  // Mock get user by ID
  const getUserById = async (id: string): Promise<UserResponseApi | null> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const user = mockUsers.find(u => u.id === id);
      return user || null;
    } catch (err) {
      console.error("Error fetching user by ID:", err);
      return null;
    }
  };

  // Filter management methods
  const applyFilters = () => {
    searchQuery.value = tempSearchQuery.value;
    statusFilter.value = [...tempStatusFilter.value];
    permissionFilter.value = [...tempPermissionFilter.value];
    currentPage.value = 1; // Reset to first page when applying filters
    fetchUsers();
  };

  const clearAllFilters = () => {
    tempSearchQuery.value = "";
    tempStatusFilter.value = [];
    tempPermissionFilter.value = [];

    searchQuery.value = "";
    statusFilter.value = [];
    permissionFilter.value = [];
    currentPage.value = 1;
    fetchUsers();
  };

  const resetTempFilters = () => {
    tempSearchQuery.value = searchQuery.value;
    tempStatusFilter.value = [...statusFilter.value];
    tempPermissionFilter.value = [...permissionFilter.value];
  };

  // Client-side filtering for additional filters not supported by API
  const filteredUsers = computed(() => {
    let filtered = users.value;

    // Apply status filter (client-side)
    if (statusFilter.value.length > 0) {
      filtered = filtered.filter(user =>
        statusFilter.value.includes(user.status)
      );
    }

    // Apply permission filter (client-side)
    if (permissionFilter.value.length > 0) {
      filtered = filtered.filter(user =>
        permissionFilter.value.includes(user.permission.name)
      );
    }

    return filtered;
  });

  // Pagination methods
  const goToPage = (page: number) => {
    currentPage.value = page;
    fetchUsers();
  };

  const nextPage = () => {
    if (currentPage.value * pageSize.value < total.value) {
      goToPage(currentPage.value + 1);
    }
  };

  const previousPage = () => {
    if (currentPage.value > 1) {
      goToPage(currentPage.value - 1);
    }
  };

  // Utility methods
  const refreshData = () => {
    fetchUsers();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    }).format(date);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    }).format(date);
  };

  // Status and permission helpers
  const getStatusColor = (status: EnumUserStatus) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "error";
      default:
        return "grey";
    }
  };

  const getStatusLabel = (status: EnumUserStatus) => {
    switch (status) {
      case "ACTIVE":
        return "ใช้งาน";
      case "INACTIVE":
        return "ไม่ใช้งาน";
      default:
        return status;
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission.toLowerCase()) {
      case "admin":
        return "warning";
      case "user":
        return "info";
      default:
        return "grey";
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission.toLowerCase()) {
      case "admin":
        return "ผู้ดูแลระบบ";
      case "user":
        return "ผู้ใช้ทั่วไป";
      default:
        return permission;
    }
  };

  // Initialize
  if (autoFetch) {
    fetchUsers();
  }

  // Initialize temp filters
  resetTempFilters();

  return {
    // State
    users: filteredUsers,
    loading,
    error,
    total,
    currentPage,
    pageSize,

    // Search and filter state
    searchQuery,
    statusFilter,
    permissionFilter,
    tempSearchQuery,
    tempStatusFilter,
    tempPermissionFilter,

    // Computed
    hasActiveFilters,
    hasFilterChanges,
    activeFilterCount,

    // Methods
    fetchUsers,
    getUserById,
    applyFilters,
    clearAllFilters,
    resetTempFilters,
    goToPage,
    nextPage,
    previousPage,
    refreshData,

    // Utility methods
    formatDateTime,
    formatDate,
    getStatusColor,
    getStatusLabel,
    getPermissionColor,
    getPermissionLabel,
  };
};