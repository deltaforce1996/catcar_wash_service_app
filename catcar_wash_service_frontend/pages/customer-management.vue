<template>
  <div>
    <!-- Header Section -->
    <div class="d-flex justify-space-between align-center flex-wrap">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">จัดการลูกค้า</h1>
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

    <!-- Enhanced Data Table -->
    <EnhancedDataTable
      card-class="mt-8"
      title="รายการลูกค้า"
      :items="users"
      :headers="customerHeaders"
      :loading="isSearching || loading"
      :has-filter-changes="hasFilterChanges"
      :page="currentSearchParams.page || 1"
      :total-items="totalUsers"
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
                placeholder="ค้นหาด้วยชื่อ อีเมล เบอร์โทร ที่อยู่และชื่อลูกค้า"
                hide-details
                clearable
                aria-label="ค้นหาลูกค้า"
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
            v-if="item.custom_name"
            class="text-caption text-medium-emphasis"
          >
            {{ item.custom_name }}
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

      <template #[`item.status`]="{ item }">
        <v-chip
          :color="getStatusColor(item.status)"
          size="small"
          variant="tonal"
        >
          {{ getStatusLabel(item.status) }}
        </v-chip>
      </template>

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
        <div v-else class="text-caption text-medium-emphasis">ไม่มีข้อมูล</div>
      </template>

      <template #[`item.created_at`]="{ item }">
        <div class="text-body-2">
          {{ formatDate(item.created_at) }}
        </div>
      </template>

      <!-- Expandable Row Content -->
      <template #expanded-content="{ item }">
        <div class="d-flex justify-space-between align-center mb-4">
          <!-- Header with customer summary -->
          <h3 class="text-subtitle-1 font-weight-bold mb-4">
            รายละเอียดลูกค้า
          </h3>

          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-pencil"
            class="text-none"
            @click="handleEditCustomer(item.id)"
          >
            แก้ไขข้อมูล
          </v-btn>
        </div>
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
                    <div class="text-caption text-medium-emphasis">ที่อยู่</div>
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
                      :color="getPermissionColor(item.permission.name)"
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
                        <div class="text-h4 font-weight-bold text-success">
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
          <span>สร้างเมื่อ: {{ formatDateTime(item.created_at) }}</span>
          <span>อัปเดตล่าสุด: {{ formatDateTime(item.updated_at) }}</span>
        </div>
      </template>
    </EnhancedDataTable>

    <!-- Add Customer Dialog -->
    <AddCustomerDialog
      v-model="showAddCustomerDialog"
      @success="handleCustomerAdded"
    />

    <!-- Edit Customer Dialog -->
    <EditCustomerDialog
      v-if="selectedUserId"
      v-model="showEditCustomerDialog"
      :user-id="selectedUserId"
      @success="handleCustomerUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import type { EnumUserStatus } from "~/types";
import type { SearchUsersRequest } from "~/services/apis/user-api.service";
import { useUser } from "~/composables/useUser";
import EnhancedDataTable from "~/components/common/EnhancedDataTable.vue";
import AddCustomerDialog from "~/components/customer/AddCustomerDialog.vue";
import EditCustomerDialog from "~/components/customer/EditCustomerDialog.vue";

// Composable
const {
  users,
  isLoading: loading,
  isSearching,
  searchUsers,
  totalUsers,
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
    await searchUsers(searchParams);
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
  await searchUsers({ page: 1 });
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

const getPermissionColor = (permission: string) => {
  switch (permission) {
    case "ADMIN":
      return "primary";
    case "TECHNICIAN":
      return "warning";
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
    case "TECHNICIAN":
      return "ช่างเทคนิค";
    case "USER":
      return "ผู้ใช้ทั่วไป";
    default:
      return permission;
  }
};

// Handle customer added successfully
const handleCustomerAdded = async () => {
  await searchUsers({ page: 1 });
};

// Handle edit customer click
const handleEditCustomer = (userId: string) => {
  selectedUserId.value = userId;
  showEditCustomerDialog.value = true;
};

// Handle customer updated successfully
const handleCustomerUpdated = async () => {
  await searchUsers({});
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
  await searchUsers();
});

// Local state
const showAddCustomerDialog = ref(false);
const showEditCustomerDialog = ref(false);
const selectedUserId = ref<string | null>(null);

// Filter options
const statusOptions: EnumUserStatus[] = ["ACTIVE", "INACTIVE"];

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
:deep(.enhanced-details-card) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(var(--v-theme-surface-container-low), 1);
}

:deep(.enhanced-breakdown) {
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
:deep(.enhanced-details-card .v-card-text) {
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
