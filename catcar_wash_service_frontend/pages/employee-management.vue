<template>
  <div>
    <!-- Header Section -->
    <div class="d-flex justify-space-between align-center flex-wrap">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">จัดการพนักงาน</h1>
      </div>
      <div class="d-flex align-center ga-3 flex-wrap">
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus"
          class="text-none"
          @click="showAddEmployeeDialog = true"
        >
          เพิ่มพนักงานใหม่
        </v-btn>
      </div>
    </div>

    <!-- Enhanced Data Table -->
    <EnhancedDataTable
      card-class="mt-8"
      title="รายการพนักงาน"
      :items="employees"
      :headers="employeeHeaders"
      :loading="isSearching || loading"
      :has-filter-changes="hasFilterChanges"
      :server-side="true"
      :page="currentSearchParams.page || 1"
      :items-per-page="currentSearchParams.limit || 1"
      :total-items="totalEmployees"
      :total-pages="totalPages"
      expandable
      @apply-filters="applyFilters"
      @clear-filters="clearAllFilters"
      @update:page="goToPage"
    >
      <!-- Filter Section -->
      <template #filters>
        <v-row>
          <!-- Search Bar -->
          <v-col cols="12" md="9">
            <div class="d-flex flex-column ga-2">
              <div class="text-caption text-medium-emphasis">
                <v-icon size="small" class="me-1">mdi-filter-variant</v-icon>
                ค้นหา
              </div>
              <v-text-field
                v-model="tempSearchQuery"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                placeholder="ค้นหาด้วยชื่อ อีเมล เบอร์โทร ตำแหน่งงาน"
                hide-details
                clearable
                aria-label="ค้นหาพนักงาน"
                role="searchbox"
              />
            </div>
          </v-col>

          <!-- Status Filter -->
          <v-col cols="12" md="3" class="d-flex flex-column ga-2">
            <div class="text-caption text-medium-emphasis">
              <v-icon size="small" class="me-1">mdi-filter-variant</v-icon>
              กรองตามสถานะ
            </div>
            <v-btn-group variant="outlined" density="compact" divided>
              <v-btn
                v-for="status in statusOptions"
                :key="status"
                :color="getStatusColor(status)"
                :variant="tempStatusFilter === status ? 'flat' : 'outlined'"
                size="small"
                class="text-none"
                @click="selectStatusFilter(status)"
              >
                {{ getStatusLabel(status) }}
              </v-btn>
              <v-btn
                color="primary"
                :variant="tempStatusFilter === null ? 'flat' : 'outlined'"
                size="small"
                class="text-none"
                @click="clearStatusFilter"
              >
                <v-icon size="small">mdi-close</v-icon>
                ทั้งหมด
              </v-btn>
            </v-btn-group>
          </v-col>
        </v-row>
      </template>

      <!-- Custom Column Templates -->
      <template #[`item.fullname`]="{ item }">
        <div>
          <div class="text-body-2 font-weight-medium">
            {{ item.fullname }}
          </div>
          <div
            v-if="item.employee_id"
            class="text-caption text-medium-emphasis"
          >
            รหัสพนักงาน: {{ item.employee_id }}
          </div>
        </div>
      </template>

      <template #[`item.email`]="{ item }">
        <div class="text-body-2">
          {{ item.email }}
        </div>
      </template>

      <template #[`item.phone`]="{ item }">
        <div class="text-body-2">
          {{ item.phone }}
        </div>
      </template>

      <template #[`item.position`]="{ item }">
        <v-chip
          :color="getPositionColor(item.position)"
          size="small"
          variant="tonal"
        >
          {{ item.position }}
        </v-chip>
      </template>

      <template #[`item.status`]="{ item }">
        <v-chip
          :color="getStatusColor(item.status)"
          size="small"
          variant="tonal"
        >
          {{ getStatusLabel(item.status) }}
        </v-chip>
      </template>

      <template #[`item.created_at`]="{ item }">
        <div class="text-body-2">
          {{ formatDate(item.created_at) }}
        </div>
      </template>

      <!-- Expandable Row Content -->
      <template #expanded-row="{ item }">
        <v-card
          class="ma-2 employee-details-card"
          color="surface-container"
          elevation="1"
          rounded="lg"
        >
          <v-card-text class="pa-4">
            <div class="employee-breakdown">
              <!-- Header with employee summary -->
              <h3 class="text-subtitle-1 font-weight-bold mb-4">
                รายละเอียดพนักงาน
              </h3>

              <!-- Employee details grid for desktop -->
              <v-row no-gutters class="employee-details-grid">
                <!-- Personal Information Section -->
                <v-col cols="12" md="6" class="employee-section">
                  <div class="employee-info-section pa-3">
                    <div class="d-flex align-center mb-3">
                      <v-icon color="primary" size="small" class="me-2">
                        mdi-account-circle
                      </v-icon>
                      <span class="text-subtitle-2 font-weight-medium">
                        ข้อมูลส่วนตัว
                      </span>
                    </div>

                    <div class="employee-info-grid">
                      <v-card class="mb-2" color="primary" variant="tonal">
                        <v-card-text class="pa-3">
                          <div class="text-caption text-medium-emphasis">
                            รหัสพนักงาน
                          </div>
                          <div class="text-body-2 font-family-monospace">
                            {{ item.employee_id }}
                          </div>
                        </v-card-text>
                      </v-card>

                      <v-card class="mb-2" color="info" variant="tonal">
                        <v-card-text class="pa-3">
                          <div class="text-caption text-medium-emphasis">
                            ที่อยู่
                          </div>
                          <div class="text-body-2">
                            {{ item.address || 'ไม่มีข้อมูล' }}
                          </div>
                        </v-card-text>
                      </v-card>

                      <v-card color="secondary" variant="tonal">
                        <v-card-text class="pa-3">
                          <div class="text-caption text-medium-emphasis">
                            สิทธิ์การใช้งาน
                          </div>
                          <v-chip
                            :color="getPermissionColor(item.permission?.name || 'USER')"
                            size="small"
                            variant="tonal"
                            class="mt-1"
                          >
                            {{ getPermissionLabel(item.permission?.name || 'USER') }}
                          </v-chip>
                        </v-card-text>
                      </v-card>
                    </div>
                  </div>
                </v-col>

                <!-- Work Information Section -->
                <v-col cols="12" md="6" class="employee-section">
                  <div class="work-info-section pa-3">
                    <div class="d-flex align-center mb-3">
                      <v-icon color="success" size="small" class="me-2">
                        mdi-briefcase
                      </v-icon>
                      <span class="text-subtitle-2 font-weight-medium">
                        ข้อมูลการทำงาน
                      </span>
                    </div>

                    <div>
                      <v-row dense>
                        <v-col cols="12">
                          <v-card
                            class="work-info-card"
                            color="success-lighten-1"
                            variant="tonal"
                          >
                            <v-card-text class="pa-3 text-center">
                              <div
                                class="text-h6 font-weight-bold text-success"
                              >
                                {{ item.position }}
                              </div>
                              <div class="text-caption">ตำแหน่งงาน</div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                        <v-col cols="6">
                          <v-card
                            class="work-info-card"
                            color="primary-lighten-1"
                            variant="tonal"
                          >
                            <v-card-text class="pa-2 text-center">
                              <div class="text-h6 font-weight-bold">
                                {{ item.department || 'ไม่ระบุ' }}
                              </div>
                              <div class="text-caption">แผนก</div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                        <v-col cols="6">
                          <v-card
                            class="work-info-card"
                            color="info-lighten-1"
                            variant="tonal"
                          >
                            <v-card-text class="pa-2 text-center">
                              <div class="text-h6 font-weight-bold">
                                {{ formatDate(item.hire_date || item.created_at) }}
                              </div>
                              <div class="text-caption">วันที่เริ่มงาน</div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                    </div>
                  </div>
                </v-col>
              </v-row>

              <!-- Timestamp Information -->
              <v-divider class="my-4" />
              <div
                class="d-flex justify-space-between text-caption text-medium-emphasis"
              >
                <span>สร้างเมื่อ: {{ formatDateTime(item.created_at) }}</span>
                <span>อัปเดตล่าสุด: {{ formatDateTime(item.updated_at) }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </template>
    </EnhancedDataTable>

    <!-- Add Employee Dialog (Placeholder) -->
    <v-dialog v-model="showAddEmployeeDialog" max-width="600">
      <v-card>
        <v-card-title class="pa-6">
          <h3 class="text-h5">เพิ่มพนักงานใหม่</h3>
        </v-card-title>
        <v-card-text>
          <p class="text-center py-8">ฟีเจอร์นี้อยู่ระหว่างการพัฒนา</p>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="outlined" @click="showAddEmployeeDialog = false">
            ปิด
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { EnumUserStatus } from "~/types";

import type { SearchUsersRequest } from "~/services/apis/user-api.service";
import { useUser } from "~/composables/useUser";
import EnhancedDataTable from "~/components/common/EnhancedDataTable.vue";

// Composable - reusing useUser for now, should be useEmployee when available
const {
  users: employees,
  isLoading: loading,
  isSearching,
  searchUsers: searchEmployees,
  totalUsers: totalEmployees,
  totalPages,
  currentSearchParams,
  goToPage,
} = useUser();

// Local reactive state for filters
const tempSearchQuery = ref("");
const tempStatusFilter = ref<EnumUserStatus | null>(null);

// Applied filter state (actual filters being used)
const appliedSearchQuery = ref("");
const appliedStatusFilter = ref<EnumUserStatus | null>(null);

// Computed to check if filters have changed
const hasFilterChanges = computed(() => {
  return (
    tempSearchQuery.value !== appliedSearchQuery.value ||
    tempStatusFilter.value !== appliedStatusFilter.value
  );
});

// Apply filters function
const applyFilters = async () => {
  const searchParams: SearchUsersRequest = {
    page: 1, // Reset to first page when applying filters
    query: {},
  };

  if (tempSearchQuery.value) {
    searchParams.query!.search = tempSearchQuery.value;
  }

  if (tempStatusFilter.value !== null) {
    searchParams.query!.status = tempStatusFilter.value;
  }

  // Update applied filter state immediately to hide warning
  // This should happen regardless of API success/failure
  appliedSearchQuery.value = tempSearchQuery.value;
  appliedStatusFilter.value = tempStatusFilter.value;

  try {
    await searchEmployees(searchParams);
  } catch (error) {
    // API call failed, but filter state has been applied for UX
    console.warn("Failed to apply filters to server:", error);
  }
};

// Clear all filters
const clearAllFilters = async () => {
  tempSearchQuery.value = "";
  tempStatusFilter.value = null;
  appliedSearchQuery.value = "";
  appliedStatusFilter.value = null;
  await searchEmployees({ page: 1 });
};

// Utility functions for formatting and display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "INACTIVE":
      return "error";
    default:
      return "grey";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "ใช้งาน";
    case "INACTIVE":
      return "ไม่ใช้งาน";
    default:
      return status;
  }
};

const getPositionColor = (position: string) => {
  switch (position?.toLowerCase()) {
    case "manager":
    case "ผู้จัดการ":
      return "purple";
    case "supervisor":
    case "หัวหน้างาน":
      return "orange";
    case "employee":
    case "พนักงาน":
      return "blue";
    default:
      return "grey";
  }
};

const getPermissionColor = (permission: string) => {
  switch (permission) {
    case "ADMIN":
      return "primary";
    case "USER":
      return "info";
    default:
      return "grey";
  }
};

const getPermissionLabel = (permission: string) => {
  switch (permission) {
    case "ADMIN":
      return "ผู้ดูแลระบบ";
    case "USER":
      return "ผู้ใช้ทั่วไป";
    default:
      return permission;
  }
};

// Select status filter function
const selectStatusFilter = (status: EnumUserStatus) => {
  tempStatusFilter.value = status;
};

// Clear status filter function
const clearStatusFilter = () => {
  tempStatusFilter.value = null;
};

// Initialize data on component mount
onMounted(async () => {
  await searchEmployees();
});

// Local state
const showAddEmployeeDialog = ref(false);

// Filter options
const statusOptions: EnumUserStatus[] = ["ACTIVE", "INACTIVE"];

// Table headers
const employeeHeaders = [
  { title: "ชื่อพนักงาน", key: "fullname", sortable: true },
  { title: "อีเมล", key: "email", sortable: true },
  { title: "เบอร์โทร", key: "phone", sortable: true },
  { title: "ตำแหน่ง", key: "position", sortable: true },
  { title: "สถานะ", key: "status", sortable: true },
  { title: "วันที่เริ่มงาน", key: "created_at", sortable: true },
  { title: "", key: "data-table-expand", sortable: false },
];
</script>

<style scoped>
/* Employee details expandable row styles */
.employee-details-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(var(--v-theme-surface-container-low), 1);
}

.employee-breakdown {
  max-width: 100%;
}

.employee-details-grid {
  gap: 0;
}

.employee-section {
  position: relative;
  min-height: 200px;
}

.employee-section:not(:last-child)::after {
  content: "";
  position: absolute;
  right: 0;
  top: 10%;
  bottom: 10%;
  width: 1px;
  background: rgba(var(--v-theme-outline), 0.2);
}

.employee-info-section,
.work-info-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.work-info-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  min-height: 60px;
}

.work-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Expand/collapse animation */
:deep(.v-data-table__expanded-row) {
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Monospace font for employee ID */
.font-family-monospace {
  font-family: "Roboto Mono", "Monaco", "Consolas", monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

/* Better responsive behavior */
@media (max-width: 960px) {
  .employee-section:not(:last-child)::after {
    display: none;
  }

  .employee-section {
    margin-bottom: 16px;
    min-height: auto;
  }

  .employee-section:not(:last-child) {
    border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
    padding-bottom: 16px;
  }
}

/* Enhanced visual hierarchy */
.employee-details-card :deep(.v-card-text) {
  padding: 24px !important;
}

.employee-info-section .text-subtitle-2,
.work-info-section .text-subtitle-2 {
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-weight: 600;
}

.work-info-card .text-h4,
.work-info-card .text-h6 {
  color: rgba(var(--v-theme-on-surface), 0.87);
  line-height: 1.2;
}

.work-info-card .text-caption {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
}
</style>