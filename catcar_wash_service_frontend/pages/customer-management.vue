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

    <!-- Customer Management Table -->
    <BaseDataTable
      title="รายการลูกค้า"
      :headers="customerHeaders"
      :items="users"
      :loading="loading"
      :has-filter-changes="hasFilterChanges"
      card-class="mt-8"
      @apply-filters="applyFilters"
      @clear-filters="clearAllFilters"
    >
      <!-- Custom Filters -->
      <template #filters>
        <v-row>
          <!-- Search Bar -->
          <v-col cols="12" md="4">
            <SearchFilter
              v-model="tempSearchQuery"
              placeholder="ค้นหาด้วยชื่อ อีเมล หรือเบอร์โทร"
              aria-label="ค้นหาลูกค้า"
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
        <div v-else class="text-caption text-medium-emphasis">
          ไม่มีข้อมูล
        </div>
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
      </template>
    </BaseDataTable>

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
import type { EnumUserStatus } from "~/types";

// Component imports
import BaseDataTable from '~/components/common/BaseDataTable.vue'
import SearchFilter from '~/components/common/SearchFilter.vue'

// Composable
const {
  users,
  loading,
  error: _error,
  tempSearchQuery,
  tempStatusFilter,
  tempPermissionFilter,
  hasFilterChanges,
  applyFilters,
  clearAllFilters,
  formatDateTime,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getPermissionColor,
  getPermissionLabel,
} = useUserManagement();

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
