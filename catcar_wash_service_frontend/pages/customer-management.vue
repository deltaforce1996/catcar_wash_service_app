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
      :server-side="true"
      :page="currentSearchParams.page || 1"
      :items-per-page="currentSearchParams.limit || 1"
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
      <template #expanded-row="{ item }">
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
                <span>สร้างเมื่อ: {{ formatDateTime(item.created_at) }}</span>
                <span>อัปเดตล่าสุด: {{ formatDateTime(item.updated_at) }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </template>
    </EnhancedDataTable>

    <!-- Add Customer Dialog -->
    <v-dialog v-model="showAddCustomerDialog" max-width="800" persistent>
      <v-card>
        <v-card-title class="pa-6">
          <h3 class="text-h5">เพิ่มลูกค้าใหม่</h3>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form v-model="formValid" @submit.prevent="registerUser">
            <v-row>
              <!-- Full Name -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="registrationForm.fullname"
                  label="ชื่อ-นามสกุล"
                  variant="outlined"
                  density="compact"
                  :rules="requiredRules"
                  required
                />
              </v-col>

              <!-- Custom Name -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="registrationForm.custom_name"
                  label="ชื่อเรียก/ชื่อร้าน"
                  variant="outlined"
                  density="compact"
                  :rules="requiredRules"
                  required
                />
              </v-col>

              <!-- Email -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="registrationForm.email"
                  label="อีเมล"
                  type="email"
                  variant="outlined"
                  density="compact"
                  :rules="emailRules"
                  required
                />
              </v-col>

              <!-- Phone -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="registrationForm.phone"
                  label="เบอร์โทรศัพท์"
                  variant="outlined"
                  density="compact"
                  :rules="phoneRules"
                  required
                />
              </v-col>

              <!-- Address -->
              <v-col cols="12">
                <v-textarea
                  v-model="registrationForm.address"
                  label="ที่อยู่"
                  variant="outlined"
                  density="compact"
                  rows="3"
                  :rules="requiredRules"
                  required
                />
              </v-col>

              <!-- Status -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="registrationForm.status"
                  label="สถานะ"
                  variant="outlined"
                  density="compact"
                  :items="[
                    { value: 'ACTIVE', title: 'ใช้งาน' },
                    { value: 'INACTIVE', title: 'ไม่ใช้งาน' }
                  ]"
                  item-value="value"
                  item-title="title"
                  :rules="requiredRules"
                  required
                />
              </v-col>

              <!-- Permission -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="registrationForm.permission_id"
                  label="สิทธิ์การใช้งาน"
                  variant="outlined"
                  density="compact"
                  :items="permissionOptions"
                  item-value="value"
                  item-title="label"
                  :rules="requiredRules"
                  required
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.label">
                      <template #prepend>
                        <v-chip
                          :color="item.raw.color"
                          size="small"
                          variant="tonal"
                          class="me-2"
                        >
                          {{ item.raw.label }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </template>
                  <template #selection="{ item }">
                    <v-chip
                      :color="item.raw.color"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.raw.label }}
                    </v-chip>
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="outlined"
            :disabled="isRegistering"
            @click="closeDialog"
          >
            ยกเลิก
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="isRegistering"
            :disabled="!formValid"
            @click="registerUser"
          >
            เพิ่มลูกค้า
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { EnumUserStatus } from "~/types";

import type { SearchUsersRequest, RegisterUserPayload } from "~/services/apis/user-api.service";
import { useUser } from "~/composables/useUser";
import { UserApiService } from "~/services/apis/user-api.service";
import EnhancedDataTable from "~/components/common/EnhancedDataTable.vue";

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

// Permission options for registration
const permissionOptions = [
  { value: "USER", label: "ผู้ใช้ทั่วไป", color: "info" },
  { value: "TECHNICIAN", label: "ช่างเทคนิค", color: "warning" },
  { value: "ADMIN", label: "ผู้ดูแลระบบ", color: "primary" }
];

// Registration function
const registerUser = async () => {
  if (!formValid.value) {
    return;
  }

  isRegistering.value = true;

  try {
    // Find the selected permission to get its ID
    const selectedPermission = permissionOptions.find(p => p.value === registrationForm.value.permission_id);
    if (!selectedPermission) {
      throw new Error("กรุณาเลือกสิทธิ์การใช้งาน");
    }

    // Create the payload (permission_id should be the actual permission ID, for now using the value)
    const payload: RegisterUserPayload = {
      ...registrationForm.value,
      permission_id: registrationForm.value.permission_id // In real scenario, this might need to be mapped to actual permission ID
    };

    await userApiService.RegisterUser(payload);

    // Success - close dialog and refresh data
    showAddCustomerDialog.value = false;
    resetForm();
    await searchUsers({ page: 1 }); // Refresh the user list

    // You might want to add a success notification here
    console.log("ลงทะเบียนลูกค้าใหม่สำเร็จ");

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการลงทะเบียน:", error);
    // You might want to add error notification here
  } finally {
    isRegistering.value = false;
  }
};

// Reset form function
const resetForm = () => {
  registrationForm.value = {
    email: "",
    fullname: "",
    phone: "",
    address: "",
    custom_name: "",
    status: "ACTIVE" as EnumUserStatus,
    permission_id: ""
  };
  formValid.value = false;
};

// Close dialog function
const closeDialog = () => {
  showAddCustomerDialog.value = false;
  resetForm();
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
const isRegistering = ref(false);

// Registration form data
const registrationForm = ref<RegisterUserPayload>({
  email: "",
  fullname: "",
  phone: "",
  address: "",
  custom_name: "",
  status: "ACTIVE" as EnumUserStatus,
  permission_id: ""
});

// Form validation
const formValid = ref(false);
const emailRules = [
  (v: string) => !!v || "กรุณากรอกอีเมล",
  (v: string) => /.+@.+\..+/.test(v) || "รูปแบบอีเมลไม่ถูกต้อง"
];
const phoneRules = [
  (v: string) => !!v || "กรุณากรอกเบอร์โทรศัพท์",
  (v: string) => /^[0-9]{10}$/.test(v) || "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก"
];
const requiredRules = [
  (v: string) => !!v || "กรุณากรอกข้อมูล"
];

// API service instance
const userApiService = new UserApiService();

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
