<template>
  <div>
    <!-- Header Section -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center flex-wrap">
          <div>
            <h3 class="font-weight-bold mb-1">จัดการพนักงาน</h3>
            <v-chip variant="tonal" color="primary" class="mt-2">
              {{ totalEmployees }} พนักงานทั้งหมด
            </v-chip>
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
      </v-col>
    </v-row>

    <!-- Employee Management Table -->
    <v-card elevation="2" rounded="lg" class="mt-8">
      <!-- Filter Section -->
      <v-card-text class="pb-2">
        <v-row>
          <!-- Search Bar -->
          <v-col cols="12" md="6">
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
                placeholder="ค้นหาด้วยชื่อ อีเมล เบอร์โทร ไลน์ และที่อยู่"
                hide-details
                clearable
                aria-label="ค้นหาพนักงาน"
                role="searchbox"
              />
            </div>
          </v-col>

          <!-- Status Filter -->
          <v-col cols="12" md="3">
            <div class="d-flex flex-column ga-2">
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
            </div>
          </v-col>

          <!-- Filter Actions -->
          <v-col cols="12" md="3">
            <div class="d-flex flex-column ga-2">
              <div class="text-caption text-medium-emphasis">
                <v-icon size="small" class="me-1">mdi-cog</v-icon>
                การดำเนินการ
              </div>
              <div class="d-flex ga-2">
                <v-btn
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-refresh"
                  @click="clearAllFilters"
                >
                  ล้างตัวกรอง
                </v-btn>
                <v-btn
                  color="primary"
                  size="small"
                  prepend-icon="mdi-check"
                  @click="applyFilters"
                >
                  ยืนยันตัวกรอง
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Filter Change Alert -->
        <v-alert
          v-if="hasFilterChanges"
          border
          density="compact"
          type="warning"
          variant="tonal"
          class="my-2"
        >
          <template #prepend>
            <v-icon>mdi-information</v-icon>
          </template>
          <strong>เตือน:</strong> คุณได้เปลี่ยนแปลงตัวกรองแล้ว กรุณากดปุ่ม
          "ยืนยันตัวกรอง" เพื่อใช้งานตัวกรองใหม่
        </v-alert>
      </v-card-text>

      <!-- Data Table -->
      <v-data-table
        :headers="employeeHeaders"
        :items="employees"
        :loading="isSearching || isLoading"
        :items-per-page="currentSearchParams.limit || 10"
        :page="currentSearchParams.page || 1"
        :items-length="totalEmployees"
        class="elevation-0"
        hover
        show-expand
        expand-on-click
        server-items-length
        hide-default-footer
      >
        <!-- Name Column -->
        <template #[`item.name`]="{ item }">
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ item.name }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ item.email }}
            </div>
          </div>
        </template>

        <!-- Phone Column -->
        <template #[`item.phone`]="{ item }">
          <div class="text-body-2">
            {{ item.phone || '-' }}
          </div>
        </template>

        <!-- Line Column -->
        <template #[`item.line`]="{ item }">
          <div class="text-body-2">
            {{ item.line || '-' }}
          </div>
        </template>

        <!-- Status Column -->
        <template #[`item.status`]="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Permission Column -->
        <template #[`item.permission`]="{ item }">
          <v-chip
            :color="getPermissionColor(item.permission.name)"
            size="small"
            variant="tonal"
          >
            {{ getPermissionLabel(item.permission.name) }}
          </v-chip>
        </template>

        <!-- Registration Date Column -->
        <template #[`item.created_at`]="{ item }">
          <div class="text-body-2">
            {{ formatDate(item.created_at || '') }}
          </div>
        </template>

        <!-- Expandable row content -->
        <template #expanded-row="{ columns, item }">
          <td :colspan="columns.length" class="pa-0">
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
                                {{ item.id.slice(-8) }}
                              </div>
                            </v-card-text>
                          </v-card>

                          <v-card class="mb-2" color="info" variant="tonal">
                            <v-card-text class="pa-3">
                              <div class="text-caption text-medium-emphasis">
                                ที่อยู่
                              </div>
                              <div class="text-body-2">
                                {{ item.address || 'ไม่ระบุ' }}
                              </div>
                            </v-card-text>
                          </v-card>

                          <v-card class="mb-2" color="success" variant="tonal">
                            <v-card-text class="pa-3">
                              <div class="text-caption text-medium-emphasis">
                                LINE ID
                              </div>
                              <div class="text-body-2">
                                {{ item.line || 'ไม่ระบุ' }}
                              </div>
                            </v-card-text>
                          </v-card>

                          <v-card color="secondary" variant="tonal">
                            <v-card-text class="pa-3">
                              <div class="text-caption text-medium-emphasis">
                                สิทธิ์การใช้งาน
                              </div>
                              <v-chip
                                :color="
                                  getPermissionColor(item.permission.name)
                                "
                                size="small"
                                variant="tonal"
                                class="mt-1"
                              >
                                {{ getPermissionLabel(item.permission.name) }}
                              </v-chip>
                            </v-card-text>
                          </v-card>
                        </div>
                      </div>
                    </v-col>

                    <!-- Contact Information Section -->
                    <v-col cols="12" md="6" class="employee-section">
                      <div class="contact-info-section pa-3">
                        <div class="d-flex align-center mb-3">
                          <v-icon color="success" size="small" class="me-2">
                            mdi-contacts
                          </v-icon>
                          <span class="text-subtitle-2 font-weight-medium">
                            ข้อมูลการติดต่อ
                          </span>
                        </div>

                        <div class="contact-info-grid">
                          <v-card
                            class="mb-3 contact-info-card"
                            color="primary-lighten-1"
                            variant="tonal"
                          >
                            <v-card-text class="pa-3">
                              <div class="d-flex align-center">
                                <v-icon color="primary" class="me-2">mdi-email</v-icon>
                                <div>
                                  <div class="text-caption text-medium-emphasis">
                                    อีเมล
                                  </div>
                                  <div class="text-body-2 font-weight-medium">
                                    {{ item.email }}
                                  </div>
                                </div>
                              </div>
                            </v-card-text>
                          </v-card>

                          <v-card
                            class="mb-3 contact-info-card"
                            color="success-lighten-1"
                            variant="tonal"
                          >
                            <v-card-text class="pa-3">
                              <div class="d-flex align-center">
                                <v-icon color="success" class="me-2">mdi-phone</v-icon>
                                <div>
                                  <div class="text-caption text-medium-emphasis">
                                    เบอร์โทร
                                  </div>
                                  <div class="text-body-2 font-weight-medium">
                                    {{ item.phone || 'ไม่ระบุ' }}
                                  </div>
                                </div>
                              </div>
                            </v-card-text>
                          </v-card>

                          <v-card
                            class="contact-info-card"
                            color="warning-lighten-1"
                            variant="tonal"
                          >
                            <v-card-text class="pa-3">
                              <div class="d-flex align-center">
                                <v-icon color="warning" class="me-2">mdi-account-group</v-icon>
                                <div>
                                  <div class="text-caption text-medium-emphasis">
                                    สถานะ
                                  </div>
                                  <v-chip
                                    :color="getStatusColor(item.status)"
                                    size="small"
                                    variant="tonal"
                                    class="mt-1"
                                  >
                                    {{ getStatusLabel(item.status) }}
                                  </v-chip>
                                </div>
                              </div>
                            </v-card-text>
                          </v-card>
                        </div>
                      </div>
                    </v-col>
                  </v-row>

                  <!-- Timestamp Information -->
                  <v-divider class="my-4" />
                  <div
                    class="d-flex justify-space-between text-caption text-medium-emphasis"
                  >
                    <span
                      >สร้างเมื่อ: {{ formatDateTime(item.created_at || '') }}</span
                    >
                    <span
                      >อัปเดตล่าสุด: {{ formatDateTime(item.updated_at || '') }}</span
                    >
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </td>
        </template>
      </v-data-table>

      <!-- Custom Pagination Controls -->
      <v-card-actions class="pa-4">
        <div class="d-flex justify-space-between align-center w-100">
          <div class="text-body-2 text-medium-emphasis">
            แสดง {{ totalEmployees }} รายการทั้งหมด
          </div>
          <div class="d-flex align-center ga-2">
            <v-btn
              variant="outlined"
              size="small"
              :disabled="(currentSearchParams.page || 1) <= 1"
              @click="previousPage"
            >
              <v-icon>mdi-chevron-left</v-icon>
              ก่อนหน้า
            </v-btn>

            <div class="d-flex align-center ga-1">
              <span class="text-body-2">หน้า</span>
              <v-chip variant="tonal" color="primary" size="small">
                {{ currentSearchParams.page || 1 }} / {{ totalPages }}
              </v-chip>
            </div>

            <v-btn
              variant="outlined"
              size="small"
              :disabled="(currentSearchParams.page || 1) >= totalPages"
              @click="nextPage"
            >
              ถัดไป
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
          </div>
        </div>
      </v-card-actions>
    </v-card>

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
import type { EnumEmpStatus } from "~/types";
import type { SearchEmpsRequest } from "~/services/apis/emp-api.service";
import { useEmployee } from "~/composables/useEmployee";

// Composable
const {
  employees,
  isLoading,
  isSearching,
  searchEmployees,
  totalEmployees,
  totalPages,
  currentSearchParams,
  nextPage,
  previousPage,
} = useEmployee();

// Local reactive state for filters
const tempSearchQuery = ref("");
const tempStatusFilter = ref<EnumEmpStatus | null>(null);

// Computed to check if filters have changed
const hasFilterChanges = computed(() => {
  return tempSearchQuery.value !== "" || tempStatusFilter.value !== null;
});

// Apply filters function
const applyFilters = async () => {
  const searchParams: SearchEmpsRequest = {
    page: 1, // Reset to first page when applying filters
    query: {},
  };

  if (tempSearchQuery.value) {
    searchParams.query!.search = tempSearchQuery.value;
  }

  if (tempStatusFilter.value !== null) {
    searchParams.query!.status = tempStatusFilter.value;
  }

  await searchEmployees(searchParams);
};

// Clear all filters
const clearAllFilters = async () => {
  tempSearchQuery.value = "";
  tempStatusFilter.value = null;
  await searchEmployees({ page: 1 });
};

// Utility functions for formatting and display
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return '-';
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

const getPermissionColor = (permission: string) => {
  switch (permission) {
    case "ADMIN":
      return "primary";
    case "TECHNICIAN":
      return "info";
    case "USER":
      return "success";
    default:
      return "grey";
  }
};

const getPermissionLabel = (permission: string) => {
  switch (permission) {
    case "ADMIN":
      return "ผู้ดูแลระบบ";
    case "TECHNICIAN":
      return "ช่างเทคนิค";
    case "USER":
      return "ผู้ใช้ทั่วไป";
    default:
      return permission;
  }
};

// Select status filter function
const selectStatusFilter = (status: EnumEmpStatus) => {
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
const statusOptions: EnumEmpStatus[] = ["ACTIVE", "INACTIVE"];

// Table headers
const employeeHeaders = [
  { title: "ชื่อพนักงาน", key: "name", sortable: true },
  { title: "เบอร์โทร", key: "phone", sortable: true },
  { title: "LINE ID", key: "line", sortable: true },
  { title: "สถานะ", key: "status", sortable: true },
  { title: "สิทธิ์", key: "permission", sortable: true },
  { title: "วันที่สมัคร", key: "created_at", sortable: true },
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
.contact-info-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.contact-info-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
}

.contact-info-card:hover {
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
.contact-info-section .text-subtitle-2 {
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-weight: 600;
}

.contact-info-card .text-body-2 {
  color: rgba(var(--v-theme-on-surface), 0.87);
  line-height: 1.2;
}

.contact-info-card .text-caption {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
}
</style>
