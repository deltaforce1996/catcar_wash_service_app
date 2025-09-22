<template>
  <div>
    <!-- Header Section -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center flex-wrap">
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">จัดการลูกค้า</h1>
            <v-chip variant="tonal" color="primary" class="mt-2">
              {{ users.length }} ลูกค้าทั้งหมด
            </v-chip>
          </div>
          <div class="d-flex align-center ga-3 flex-wrap">
            <v-btn
              color="primary"
              prepend-icon="mdi-account-plus"
              class="text-none"
              @click="showAddCustomerDialog = true"
            >
              เพิ่มลูกค้าใหม่
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Customer Management Table -->
    <v-card elevation="2" rounded="lg" class="mt-8">
      <v-card-title class="pa-6">
        <div class="d-flex justify-space-between align-center">
          <h2 class="text-h5 font-weight-bold">รายการลูกค้า</h2>
          <v-chip variant="tonal" color="primary">
            {{ users.length }} รายการ
          </v-chip>
        </div>
      </v-card-title>

      <!-- Filter Section -->
      <v-card-text class="pb-2">
        <v-row>
          <!-- Search Bar -->
          <v-col cols="12" md="4">
            <v-text-field
              v-model="tempSearchQuery"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              placeholder="ค้นหาด้วยชื่อ อีเมล หรือเบอร์โทร"
              hide-details
              clearable
              aria-label="ค้นหาลูกค้า"
              role="searchbox"
            />
          </v-col>

          <!-- Status Filter -->
          <v-col cols="12" md="4">
            <v-combobox
              v-model="tempStatusFilter"
              :items="statusOptions"
              label="กรองตามสถานะ"
              prepend-inner-icon="mdi-filter-variant"
              variant="outlined"
              density="compact"
              chips
              clearable
              closable-chips
              multiple
              hide-details
            >
              <template #chip="{ props, item }">
                <v-chip
                  v-bind="props"
                  :color="getStatusColor(item.raw)"
                  size="small"
                  variant="tonal"
                >
                  {{ getStatusLabel(item.raw) }}
                </v-chip>
              </template>
            </v-combobox>
          </v-col>

          <!-- Permission Filter -->
          <v-col cols="12" md="4">
            <v-combobox
              v-model="tempPermissionFilter"
              :items="permissionOptions"
              label="กรองตามสิทธิ์"
              prepend-inner-icon="mdi-account-key"
              variant="outlined"
              density="compact"
              chips
              clearable
              closable-chips
              multiple
              hide-details
            >
              <template #chip="{ props, item }">
                <v-chip
                  v-bind="props"
                  :color="getPermissionColor(item.raw)"
                  size="small"
                  variant="tonal"
                >
                  {{ getPermissionLabel(item.raw) }}
                </v-chip>
              </template>
            </v-combobox>
          </v-col>
        </v-row>

        <!-- Filter Actions -->
        <v-row class="mt-6">
          <v-col cols="12" class="d-flex justify-end ga-2">
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
        :headers="customerHeaders"
        :items="users"
        :loading="isSearching || isLoading"
        :items-per-page="10"
        class="elevation-0"
        hover
        show-expand
        expand-on-click
      >
        <!-- Name Column -->
        <template #[`item.fullname`]="{ item }">
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ item.fullname }}
            </div>
            <div
              v-if="item.custom_name"
              class="text-caption text-medium-emphasis"
            >
              {{ item.custom_name }}
            </div>
          </div>
        </template>

        <!-- Email Column -->
        <template #[`item.email`]="{ item }">
          <div class="text-body-2">
            {{ item.email }}
          </div>
        </template>

        <!-- Phone Column -->
        <template #[`item.phone`]="{ item }">
          <div class="text-body-2">
            {{ item.phone }}
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

        <!-- Device Count Column -->
        <template #[`item.device_counts`]="{ item }">
          <div v-if="item.device_counts" class="text-body-2">
            <div class="font-weight-medium">
              {{ item.device_counts.total }} อุปกรณ์
            </div>
            <div class="text-caption text-medium-emphasis">
              ใช้งาน: {{ item.device_counts.active }} / หยุด:
              {{ item.device_counts.inactive }}
            </div>
          </div>
          <div v-else class="text-caption text-medium-emphasis">
            ไม่มีข้อมูล
          </div>
        </template>

        <!-- Registration Date Column -->
        <template #[`item.created_at`]="{ item }">
          <div class="text-body-2">
            {{ formatDate(item.created_at) }}
          </div>
        </template>

        <!-- Expandable row content -->
        <template #expanded-row="{ columns, item }">
          <td :colspan="columns.length" class="pa-0">
            <v-card
              class="ma-2 customer-details-card"
              color="surface-container"
              elevation="1"
              rounded="lg"
            >
              <v-card-text class="pa-4">
                <div class="customer-breakdown">
                  <!-- Header with customer summary -->
                  <h3 class="text-subtitle-1 font-weight-bold mb-4">
                    รายละเอียดลูกค้า
                  </h3>

                  <!-- Customer details grid for desktop -->
                  <v-row no-gutters class="customer-details-grid">
                    <!-- Personal Information Section -->
                    <v-col cols="12" md="6" class="customer-section">
                      <div class="customer-info-section pa-3">
                        <div class="d-flex align-center mb-3">
                          <v-icon color="primary" size="small" class="me-2">
                            mdi-account-circle
                          </v-icon>
                          <span class="text-subtitle-2 font-weight-medium">
                            ข้อมูลส่วนตัว
                          </span>
                        </div>

                        <div class="customer-info-grid">
                          <v-card class="mb-2" color="primary" variant="tonal">
                            <v-card-text class="pa-3">
                              <div class="text-caption text-medium-emphasis">
                                รหัสลูกค้า
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
                                {{ item.address }}
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

                    <!-- Device Information Section -->
                    <v-col cols="12" md="6" class="customer-section">
                      <div class="device-info-section pa-3">
                        <div class="d-flex align-center mb-3">
                          <v-icon color="success" size="small" class="me-2">
                            mdi-devices
                          </v-icon>
                          <span class="text-subtitle-2 font-weight-medium">
                            ข้อมูลอุปกรณ์
                          </span>
                        </div>

                        <div v-if="item.device_counts">
                          <v-row dense>
                            <v-col cols="12">
                              <v-card
                                class="device-count-card"
                                color="success-lighten-1"
                                variant="tonal"
                              >
                                <v-card-text class="pa-3 text-center">
                                  <div
                                    class="text-h4 font-weight-bold text-success"
                                  >
                                    {{ item.device_counts.total }}
                                  </div>
                                  <div class="text-caption">อุปกรณ์ทั้งหมด</div>
                                </v-card-text>
                              </v-card>
                            </v-col>
                            <v-col cols="6">
                              <v-card
                                class="device-count-card"
                                color="primary-lighten-1"
                                variant="tonal"
                              >
                                <v-card-text class="pa-2 text-center">
                                  <div class="text-h6 font-weight-bold">
                                    {{ item.device_counts.active }}
                                  </div>
                                  <div class="text-caption">ใช้งาน</div>
                                </v-card-text>
                              </v-card>
                            </v-col>
                            <v-col cols="6">
                              <v-card
                                class="device-count-card"
                                color="error-lighten-1"
                                variant="tonal"
                              >
                                <v-card-text class="pa-2 text-center">
                                  <div class="text-h6 font-weight-bold">
                                    {{ item.device_counts.inactive }}
                                  </div>
                                  <div class="text-caption">หยุดใช้งาน</div>
                                </v-card-text>
                              </v-card>
                            </v-col>
                          </v-row>
                        </div>
                        <div v-else class="text-caption text-medium-emphasis">
                          ไม่มีข้อมูลอุปกรณ์
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
                      >สร้างเมื่อ: {{ formatDateTime(item.created_at) }}</span
                    >
                    <span
                      >อัปเดตล่าสุด: {{ formatDateTime(item.updated_at) }}</span
                    >
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- Add Customer Dialog (Placeholder) -->
    <v-dialog v-model="showAddCustomerDialog" max-width="600">
      <v-card>
        <v-card-title class="pa-6">
          <h3 class="text-h5">เพิ่มลูกค้าใหม่</h3>
        </v-card-title>
        <v-card-text>
          <p class="text-center py-8">ฟีเจอร์นี้อยู่ระหว่างการพัฒนา</p>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="outlined" @click="showAddCustomerDialog = false">
            ปิด
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { EnumUserStatus, EnumPermissionType } from "~/types";
import type { SearchUsersRequest } from "~/services/apis/user-api.service";
import { useUser } from "~/composables/useUser";

// Composable
const {
  users,
  isLoading,
  isSearching,
  searchUsers,
} = useUser();

// Local reactive state for filters
const tempSearchQuery = ref("");
const tempStatusFilter = ref<EnumUserStatus[]>([]);
const tempPermissionFilter = ref<string[]>([]);

// Computed to check if filters have changed
const hasFilterChanges = computed(() => {
  return tempSearchQuery.value !== "" || 
         tempStatusFilter.value.length > 0 || 
         tempPermissionFilter.value.length > 0;
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

  if (tempStatusFilter.value.length > 0) {
    searchParams.query!.status = tempStatusFilter.value[0]; // API expects single status
  }

  if (tempPermissionFilter.value.length > 0) {
    searchParams.query!.permission = tempPermissionFilter.value[0] as EnumPermissionType; // API expects single permission
  }

  await searchUsers(searchParams);
};

// Clear all filters
const clearAllFilters = async () => {
  tempSearchQuery.value = "";
  tempStatusFilter.value = [];
  tempPermissionFilter.value = [];
  await searchUsers({ page: 1 });
};

// Utility functions for formatting and display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'INACTIVE':
      return 'error';
    default:
      return 'grey';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'ใช้งาน';
    case 'INACTIVE':
      return 'ไม่ใช้งาน';
    default:
      return status;
  }
};

const getPermissionColor = (permission: string) => {
  switch (permission) {
    case 'ADMIN':
      return 'primary';
    case 'USER':
      return 'info';
    default:
      return 'grey';
  }
};

const getPermissionLabel = (permission: string) => {
  switch (permission) {
    case 'ADMIN':
      return 'ผู้ดูแลระบบ';
    case 'USER':
      return 'ผู้ใช้ทั่วไป';
    default:
      return permission;
  }
};

// Initialize data on component mount
onMounted(async () => {
  await searchUsers();
});

// Local state
const showAddCustomerDialog = ref(false);

// Filter options
const statusOptions: EnumUserStatus[] = ["ACTIVE", "INACTIVE"];
const permissionOptions = ["USER", "ADMIN"];

// Table headers
const customerHeaders = [
  { title: "ชื่อลูกค้า", key: "fullname", sortable: true },
  { title: "อีเมล", key: "email", sortable: true },
  { title: "เบอร์โทร", key: "phone", sortable: true },
  { title: "สถานะ", key: "status", sortable: true },
  { title: "จำนวนอุปกรณ์", key: "device_counts", sortable: false },
  { title: "วันที่สมัคร", key: "created_at", sortable: true },
  { title: "", key: "data-table-expand", sortable: false },
];
</script>

<style scoped>
/* Customer details expandable row styles */
.customer-details-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(var(--v-theme-surface-container-low), 1);
}

.customer-breakdown {
  max-width: 100%;
}

.customer-details-grid {
  gap: 0;
}

.customer-section {
  position: relative;
  min-height: 200px;
}

.customer-section:not(:last-child)::after {
  content: "";
  position: absolute;
  right: 0;
  top: 10%;
  bottom: 10%;
  width: 1px;
  background: rgba(var(--v-theme-outline), 0.2);
}

.customer-info-section,
.device-info-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.device-count-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  min-height: 60px;
}

.device-count-card:hover {
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

/* Monospace font for customer ID */
.font-family-monospace {
  font-family: "Roboto Mono", "Monaco", "Consolas", monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

/* Better responsive behavior */
@media (max-width: 960px) {
  .customer-section:not(:last-child)::after {
    display: none;
  }

  .customer-section {
    margin-bottom: 16px;
    min-height: auto;
  }

  .customer-section:not(:last-child) {
    border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
    padding-bottom: 16px;
  }
}

/* Enhanced visual hierarchy */
.customer-details-card :deep(.v-card-text) {
  padding: 24px !important;
}

.customer-info-section .text-subtitle-2,
.device-info-section .text-subtitle-2 {
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-weight: 600;
}

.device-count-card .text-h4,
.device-count-card .text-h6 {
  color: rgba(var(--v-theme-on-surface), 0.87);
  line-height: 1.2;
}

.device-count-card .text-caption {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
}
</style>