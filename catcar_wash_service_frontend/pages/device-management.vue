<template>
  <div>
    <!-- Header Section -->
    <div class="d-flex justify-space-between align-center flex-wrap">
      <h1 class="text-h4 font-weight-bold mb-1">จัดการอุปกรณ์</h1>
    </div>

    <!-- Enhanced Data Table -->
    <EnhancedDataTable
      v-model:selected="selectedDevices"
      card-class="mt-0"
      title="รายการอุปกรณ์"
      :items="filteredDevices"
      :headers="deviceHeaders"
      :loading="false"
      :has-filter-changes="hasFilterChanges"
      :total-items="filteredDevices.length"
      :total-pages="1"
      show-select
      expandable
      @apply-filters="applyFilters"
      @clear-filters="clearAllFilters"
    >
      <!-- Filter Section -->
      <template #filters>
        <v-card
          flat
          color="surface-container-low"
          class="pa-4 mb-2"
          rounded="lg"
        >
          <!-- Search Bar - Full Width -->
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="tempDeviceSearch"
                prepend-inner-icon="mdi-magnify"
                variant="solo"
                density="comfortable"
                placeholder="ค้นหาด้วยชื่ออุปกรณ์ รหัสเครื่อง หรือชื่อเจ้าของ..."
                hide-details
                clearable
                rounded="lg"
                aria-label="ค้นหาอุปกรณ์"
                role="searchbox"
                class="filter-search"
              />
            </v-col>
          </v-row>

          <!-- Advanced Filters -->
          <v-row dense class="mt-2">
            <!-- Device Type Filter -->
            <v-col cols="12" sm="6" md="4">
              <div class="filter-group">
                <label class="filter-label">
                  <v-icon size="18" class="me-1">mdi-cog</v-icon>
                  ประเภทอุปกรณ์
                </label>
                <v-combobox
                  v-model="tempSelectedTypeFilters"
                  :items="getTypeOptions()"
                  placeholder="ทั้งหมด"
                  prepend-inner-icon="mdi-cog"
                  variant="solo"
                  density="compact"
                  chips
                  clearable
                  closable-chips
                  multiple
                  hide-details
                  rounded="lg"
                  class="filter-input"
                >
                  <template #chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      :color="getTypeColor(item.raw)"
                      size="small"
                      variant="flat"
                    >
                      {{ getTypeLabel(item.raw) }}
                    </v-chip>
                  </template>
                </v-combobox>
              </div>
            </v-col>

            <!-- Device Status Filter -->
            <v-col cols="12" sm="6" md="4">
              <div class="filter-group">
                <label class="filter-label">
                  <v-icon size="18" class="me-1"
                    >mdi-checkbox-marked-circle-outline</v-icon
                  >
                  สถานะ
                </label>
                <v-combobox
                  v-model="tempSelectedFilters"
                  :items="getFilterOptions()"
                  placeholder="ทั้งหมด"
                  prepend-inner-icon="mdi-checkbox-marked-circle-outline"
                  variant="solo"
                  density="compact"
                  chips
                  clearable
                  closable-chips
                  multiple
                  hide-details
                  rounded="lg"
                  class="filter-input"
                >
                  <template #chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      :color="getStatusColor(item.raw)"
                      size="small"
                      variant="flat"
                    >
                      {{ getStatusLabel(item.raw) }}
                    </v-chip>
                  </template>
                </v-combobox>
              </div>
            </v-col>

            <!-- Owner Filter -->
            <v-col cols="12" sm="6" md="4">
              <div class="filter-group">
                <label class="filter-label">
                  <v-icon size="18" class="me-1">mdi-account-circle</v-icon>
                  เจ้าของ
                </label>
                <v-combobox
                  v-model="tempSelectedUserFilters"
                  :items="getUserOptions()"
                  placeholder="ทั้งหมด"
                  prepend-inner-icon="mdi-account-circle"
                  variant="solo"
                  density="compact"
                  chips
                  clearable
                  closable-chips
                  multiple
                  hide-details
                  rounded="lg"
                  class="filter-input"
                >
                  <template #chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      color="primary"
                      size="small"
                      variant="flat"
                    >
                      {{ item.raw }}
                    </v-chip>
                  </template>
                </v-combobox>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </template>

      <!-- Device Name Column -->
      <template #[`item.name`]="{ item }">
        <div class="text-body-2 font-weight-medium">
          {{ item.name }}
        </div>
      </template>

      <!-- Type Column -->
      <template #[`item.type`]="{ item }">
        <v-chip :color="getTypeColor(item.type)" size="small" variant="tonal">
          {{ getTypeLabel(item.type) }}
        </v-chip>
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

      <!-- Owner Column -->
      <template #[`item.owner.fullname`]="{ item }">
        <div class="text-body-2">
          {{ item.owner.fullname }}
        </div>
      </template>

      <!-- Registered By Column -->
      <template #[`item.registered_by.name`]="{ item }">
        <div class="text-body-2">
          {{ item.registered_by.name }}
        </div>
      </template>

      <!-- Expandable Row Content -->
      <template #expanded-content="{ item }">
        <!-- Compact Device Info Header -->
        <div class="d-flex justify-space-between align-center mb-4">
          <div class="d-flex align-center" style="gap: 24px">
            <v-chip color="info" size="small" variant="tonal" class="px-3">
              ID: {{ item.id.slice(-8) }}
            </v-chip>
            <span class="text-body-2 text-on-surface-variant">
              สร้าง: {{ formatDate(item.created_at) }}
            </span>
            <span class="text-body-2 text-on-surface-variant">
              {{ item.owner.email }}
            </span>
          </div>
          <v-btn
            color="primary"
            variant="outlined"
            size="small"
            prepend-icon="mdi-pencil"
            class="text-none"
            @click="openDeviceDetailDialog(item)"
          >
            แก้ไขการตั้งค่า
          </v-btn>
        </div>

        <!-- Sale Config Grid -->
        <div class="mb-2">
          <h4 class="text-subtitle-1 font-weight-bold mb-2">
            การตั้งค่าการขาย
          </h4>
          <v-row dense>
            <v-col
              v-for="(config, key) in item.configs.sale"
              :key="key"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <v-card
                elevation="1"
                color="surface-container"
                class="pa-2"
                height="80"
                rounded="lg"
              >
                <div class="d-flex flex-column h-100">
                  <div class="d-flex justify-space-between align-start mb-1">
                    <span
                      class="text-body-2 font-weight-medium text-truncate"
                      style="max-width: 120px"
                    >
                      {{ config.description }}
                    </span>
                    <v-chip
                      size="x-small"
                      color="on-surface-variant"
                      variant="flat"
                      class="ml-1"
                    >
                      {{ key }}
                    </v-chip>
                  </div>
                  <v-spacer />
                  <div class="d-flex align-center justify-space-between">
                    <v-chip
                      color="success"
                      size="small"
                      variant="elevated"
                      class="font-weight-bold"
                    >
                      {{ config.value }}
                    </v-chip>
                    <span class="text-caption text-on-surface-variant">
                      {{ config.unit }}
                    </span>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </template>
    </EnhancedDataTable>

    <!-- Apply System Config Confirmation Dialog -->
    <v-dialog v-model="showApplySystemConfigDialog" max-width="500">
      <v-card>
        <v-card-title class="pa-6">
          <h3 class="text-h5">ยืนยันการเปลี่ยนแปลงการตั้งค่า</h3>
        </v-card-title>
        <v-card-text>
          <p>
            คุณต้องการนำการตั้งค่าระบบไปใช้กับอุปกรณ์ที่เลือก
            {{ selectedDevicesCount }} เครื่องหรือไม่?
          </p>
          <v-alert color="warning" variant="tonal" class="mt-4">
            การเปลี่ยนแปลงนี้จะส่งผลต่อการทำงานของอุปกรณ์ทันที
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="showApplySystemConfigDialog = false"
          >
            ยกเลิก
          </v-btn>
          <v-btn color="primary" @click="applySystemConfig"> ยืนยัน </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Device Detail Dialog Component -->
    <DeviceDetailDialog
      v-model="showDeviceDetailDialog"
      :device="selectedDevice"
      @save="showApplyDeviceConfigDialog = true"
      @toggle-status="toggleDeviceStatus"
    />

    <!-- Apply Device Config Confirmation Dialog -->
    <v-dialog v-model="showApplyDeviceConfigDialog" max-width="500">
      <v-card>
        <v-card-title class="pa-6">
          <h3 class="text-h5">ยืนยันการเปลี่ยนแปลงการตั้งค่าอุปกรณ์</h3>
        </v-card-title>
        <v-card-text>
          <p>
            คุณต้องการบันทึกการตั้งค่าของอุปกรณ์
            {{ selectedDevice?.deviceName }} หรือไม่?
          </p>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="showApplyDeviceConfigDialog = false"
          >
            ยกเลิก
          </v-btn>
          <v-btn color="primary" @click="applyDeviceConfig"> ยืนยัน </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { devicesData, type Device, type DeviceConfig } from "~/data/devices";
import EnhancedDataTable from "~/components/common/EnhancedDataTable.vue";

// Reactive state
const selectedDevices = ref<Device[]>([]);
const showApplySystemConfigDialog = ref(false);
const showDeviceDetailDialog = ref(false);
const showApplyDeviceConfigDialog = ref(false);
const selectedDevice = ref<Device | null>(null);
const isEditMode = ref(false);
const editableConfigs = ref<Record<string, DeviceConfig>>({});
const originalConfigs = ref<Record<string, DeviceConfig>>({});

// Temporary filter state (before applying)
const tempDeviceSearch = ref("");
const tempSelectedTypeFilters = ref<string[]>([]);
const tempSelectedFilters = ref<string[]>([]);
const tempSelectedUserFilters = ref<string[]>([]);

// Applied filter state (actual filters being used)
const appliedDeviceSearch = ref("");
const appliedSelectedTypeFilters = ref<string[]>([]);
const appliedSelectedFilters = ref<string[]>([]);
const appliedSelectedUserFilters = ref<string[]>([]);

// Device data imported from separate file
const allDevices = ref<Device[]>(devicesData);

// Table headers
const deviceHeaders = [
  { title: "ชื่ออุปกรณ์", key: "name", sortable: true },
  { title: "ประเภท", key: "type", sortable: true },
  { title: "สถานะ", key: "status", sortable: true },
  { title: "เจ้าของ", key: "owner.fullname", sortable: true },
  { title: "ลงทะเบียนโดย", key: "registered_by.name", sortable: true },
];

// Computed to check if filters have changed
const hasFilterChanges = computed(() => {
  return (
    tempDeviceSearch.value !== appliedDeviceSearch.value ||
    JSON.stringify(tempSelectedTypeFilters.value) !==
      JSON.stringify(appliedSelectedTypeFilters.value) ||
    JSON.stringify(tempSelectedFilters.value) !==
      JSON.stringify(appliedSelectedFilters.value) ||
    JSON.stringify(tempSelectedUserFilters.value) !==
      JSON.stringify(appliedSelectedUserFilters.value)
  );
});

// Computed to check if any filters are active
const hasActiveFilters = computed(() => {
  return (
    tempDeviceSearch.value.trim() !== "" ||
    tempSelectedTypeFilters.value.length > 0 ||
    tempSelectedFilters.value.length > 0 ||
    tempSelectedUserFilters.value.length > 0
  );
});

// Computed properties
const filteredDevices = computed(() => {
  let filtered = allDevices.value;

  // Type filter using applied state
  if (appliedSelectedTypeFilters.value.length > 0) {
    filtered = filtered.filter((device) =>
      appliedSelectedTypeFilters.value.includes(device.type)
    );
  }

  // Search filter using applied state
  if (appliedDeviceSearch.value && appliedDeviceSearch.value.trim()) {
    const query = appliedDeviceSearch.value.toLowerCase();
    filtered = filtered.filter(
      (device) =>
        device.name.toLowerCase().includes(query) ||
        device.id.toLowerCase().includes(query) ||
        device.owner.fullname.toLowerCase().includes(query)
    );
  }

  // Status filter using applied state
  if (appliedSelectedFilters.value.length > 0) {
    filtered = filtered.filter((device) =>
      appliedSelectedFilters.value.includes(device.status)
    );
  }

  // User filter using applied state
  if (appliedSelectedUserFilters.value.length > 0) {
    filtered = filtered.filter((device) =>
      appliedSelectedUserFilters.value.includes(device.owner.id)
    );
  }

  return filtered;
});

const selectedDevicesCount = computed(() => selectedDevices.value.length);

// Apply filters function
const applyFilters = () => {
  appliedDeviceSearch.value = tempDeviceSearch.value;
  appliedSelectedTypeFilters.value = [...tempSelectedTypeFilters.value];
  appliedSelectedFilters.value = [...tempSelectedFilters.value];
  appliedSelectedUserFilters.value = [...tempSelectedUserFilters.value];
};

// Clear all filters
const clearAllFilters = () => {
  tempDeviceSearch.value = "";
  tempSelectedTypeFilters.value = [];
  tempSelectedFilters.value = [];
  tempSelectedUserFilters.value = [];
  appliedDeviceSearch.value = "";
  appliedSelectedTypeFilters.value = [];
  appliedSelectedFilters.value = [];
  appliedSelectedUserFilters.value = [];
};

// Methods
const getTypeOptions = () => {
  const types = [...new Set(allDevices.value.map((device) => device.type))];
  return types;
};

const getFilterOptions = () => {
  const statuses = [
    ...new Set(allDevices.value.map((device) => device.status)),
  ];
  return statuses;
};

const getUserOptions = () => {
  const users = [...new Set(allDevices.value.map((device) => device.owner.id))];
  return users;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "DEPLOYED":
      return "success";
    case "MAINTENANCE":
      return "warning";
    case "ERROR":
      return "error";
    case "DISABLED":
      return "grey";
    default:
      return "grey";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "DEPLOYED":
      return "ใช้งานได้";
    case "MAINTENANCE":
      return "บำรุงรักษา";
    case "ERROR":
      return "ขัดข้อง";
    case "DISABLED":
      return "ปิดใช้งาน";
    default:
      return status;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "WASH":
      return "primary";
    case "DRYING":
      return "secondary";
    default:
      return "grey";
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "WASH":
      return "เครื่องล้าง";
    case "DRYING":
      return "เครื่องอบแห้ง";
    default:
      return type;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const openDeviceDetailDialog = (device: Device) => {
  selectedDevice.value = device;
  originalConfigs.value = JSON.parse(JSON.stringify(device.configs.sale));
  editableConfigs.value = JSON.parse(JSON.stringify(device.configs.sale));
  isEditMode.value = false;
  showDeviceDetailDialog.value = true;
};

const toggleDeviceStatus = () => {
  if (selectedDevice.value) {
    selectedDevice.value.status =
      selectedDevice.value.status === "DEPLOYED" ? "MAINTENANCE" : "DEPLOYED";
    // TODO: Implement API call to update device status
  }
};

const applySystemConfig = () => {
  // TODO: Implement system config application logic
  showApplySystemConfigDialog.value = false;
  // Show success notification or handle errors
};

const applyDeviceConfig = () => {
  // TODO: Implement device config save logic
  if (selectedDevice.value) {
    selectedDevice.value.configs.sale = { ...editableConfigs.value };
  }
  showApplyDeviceConfigDialog.value = false;
  isEditMode.value = false;
  // Show success notification or handle errors
};

// Filter removal helpers
const removeTypeFilter = (type: string) => {
  const index = tempSelectedTypeFilters.value.indexOf(type);
  if (index > -1) {
    tempSelectedTypeFilters.value.splice(index, 1);
  }
};

const removeStatusFilter = (status: string) => {
  const index = tempSelectedFilters.value.indexOf(status);
  if (index > -1) {
    tempSelectedFilters.value.splice(index, 1);
  }
};

const removeUserFilter = (user: string) => {
  const index = tempSelectedUserFilters.value.indexOf(user);
  if (index > -1) {
    tempSelectedUserFilters.value.splice(index, 1);
  }
};
</script>

<style scoped>
.system-config-placeholder {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 16px;
}

/* Filter Styling */
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  padding-left: 4px;
}

.filter-search :deep(.v-field__input) {
  font-size: 0.95rem;
}

.filter-input :deep(.v-field) {
  transition: all 0.2s ease;
}

.filter-input :deep(.v-field:hover) {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.filter-input :deep(.v-field--focused) {
  background: rgba(var(--v-theme-primary), 0.05);
}
</style>
