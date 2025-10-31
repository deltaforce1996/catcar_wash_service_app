<template>
  <div>
    <!-- Header Section -->
    <div class="d-flex justify-space-between align-center flex-wrap mb-6">
      <h1 class="text-h4 font-weight-bold mb-1">จัดการอุปกรณ์</h1>
    </div>

    <!-- Enhanced Data Table -->
    <EnhancedDataTable
      v-model:selected="selectedDevices"
      card-class="mt-0"
      title="รายการอุปกรณ์"
      :items="filteredDevices"
      :headers="deviceHeaders"
      :loading="isSearching || isUpdating"
      :has-filter-changes="hasFilterChanges"
      :total-items="totalDevices"
      :total-pages="totalPages"
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
            <v-col cols="12" sm="6">
              <div class="filter-group">
                <label class="filter-label">
                  <v-icon size="18" class="me-1">mdi-cog</v-icon>
                  ประเภทอุปกรณ์
                </label>
                <v-combobox
                  v-model="tempSelectedTypeFilters"
                  :items="getTypeOptions()"
                  item-title="label"
                  item-value="value"
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
                  return-object
                >
                  <template #chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      :color="getDeviceTypeColor(item.raw.value)"
                      size="small"
                      variant="flat"
                    >
                      {{ item.raw.label }}
                    </v-chip>
                  </template>
                </v-combobox>
              </div>
            </v-col>

            <!-- Device Status Filter -->
            <v-col cols="12" sm="6">
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
                  item-title="label"
                  item-value="value"
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
                  return-object
                >
                  <template #chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      :color="getDeviceStatusColor(item.raw.value)"
                      size="small"
                      variant="flat"
                    >
                      {{ item.raw.label }}
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
        <v-chip
          :color="getDeviceTypeColor(item.type)"
          size="small"
          variant="tonal"
        >
          {{ getDeviceTypeLabel(item.type) }}
        </v-chip>
      </template>

      <!-- Status Column -->
      <template #[`item.status`]="{ item }">
        <v-chip
          :color="getDeviceStatusColor(item.status)"
          size="small"
          variant="tonal"
        >
          {{ getDeviceStatusLabel(item.status) }}
        </v-chip>
      </template>

      <!-- Last Online Column -->
      <template #[`item.last_online`]="{ item }">
        <v-chip
          :color="getLastOnlineStatus(item).color"
          size="small"
          variant="tonal"
        >
          {{ getLastOnlineStatus(item).text }}
        </v-chip>
      </template>

      <!-- Owner Column -->
      <template #[`item.owner.fullname`]="{ item }">
        <div class="text-body-2">
          {{ item.owner?.fullname || "-" }}
        </div>
      </template>

      <!-- Registered By Column -->
      <template #[`item.registered_by.name`]="{ item }">
        <div class="text-body-2">
          {{ item.registered_by?.name || "-" }}
        </div>
      </template>

      <!-- Expandable Row Content -->
      <template #expanded-content="{ item }">
        <!-- Sale Config Grid -->
        <div v-if="item.configs?.sale" class="mb-2">
          <div class="d-flex justify-space-between align-center mb-4">
            <h4 class="text-subtitle-1 font-weight-bold mb-2">
              การตั้งค่าการขาย
            </h4>
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
          <v-row dense>
            <v-col
              v-for="(config, key) in item.configs.sale"
              :key="key"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <!-- WASH device config card (single value) -->
              <v-card
                v-if="item.type === 'WASH' && config.value !== undefined"
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
                  <div class="d-flex align-center justify-end">
                    <v-chip
                      color="success"
                      size="small"
                      variant="elevated"
                      class="font-weight-bold"
                    >
                      {{ config.value }}
                      {{ config.unit }}
                    </v-chip>
                  </div>
                </div>
              </v-card>

              <!-- DRYING device config card (range: start-end) -->
              <v-card
                v-else-if="
                  item.type === 'DRYING' &&
                  config.start !== undefined &&
                  config.end !== undefined
                "
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
                  <div class="d-flex align-center justify-end">
                    <v-chip
                      color="info"
                      size="small"
                      variant="elevated"
                      class="font-weight-bold"
                    >
                      {{ config.start }}-{{ config.end }}
                      {{ config.unit }}
                    </v-chip>
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
      ref="deviceDetailDialogRef"
      v-model="showDeviceDetailDialog"
      :device="selectedDevice"
      @save="showApplyDeviceConfigDialog = true"
      @toggle-status="toggleDeviceStatus"
      @device-updated="handleDeviceUpdated"
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
            {{ selectedDevice?.name }} หรือไม่?
          </p>
          <v-alert
            v-if="applyDeviceConfigError"
            color="error"
            variant="tonal"
            class="mt-4"
          >
            <v-icon class="mr-1">mdi-alert-circle</v-icon>
            {{ applyDeviceConfigError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="outlined"
            :disabled="isUpdating"
            @click="
              showApplyDeviceConfigDialog = false;
              applyDeviceConfigError = '';
            "
          >
            {{ applyDeviceConfigError ? 'ปิด' : 'ยกเลิก' }}
          </v-btn>
          <v-btn
            v-if="!applyDeviceConfigError"
            color="primary"
            :loading="isUpdating"
            @click="applyDeviceConfig"
          >
            ยืนยัน
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type {
  DeviceResponseApi,
  DeviceConfig,
} from "~/services/apis/device-api.service";
import EnhancedDataTable from "~/components/common/EnhancedDataTable.vue";
import DeviceDetailDialog from "~/components/DeviceDetailDialog.vue";
import { getLastOnlineStatus } from "~/utils/device-utils";

// Import enum translation composable
const {
  getDeviceTypeLabel,
  getDeviceTypeColor,
  getDeviceStatusLabel,
  getDeviceStatusColor,
  deviceTypeOptions,
  deviceStatusOptions,
} = useEnumTranslation();

// Device API Composable
const {
  devices: apiDevices,
  currentDevice,
  isSearching,
  isUpdating,
  error: apiError,
  successMessage: _apiSuccessMessage,
  totalDevices,
  totalPages,
  searchDevices,
  updateDeviceConfigs,
  clearMessages: _clearMessages,
} = useDevice();

// Reactive state
const selectedDevices = ref<DeviceResponseApi[]>([]);
const showApplySystemConfigDialog = ref(false);
const showDeviceDetailDialog = ref(false);
const showApplyDeviceConfigDialog = ref(false);
const applyDeviceConfigError = ref<string>("");
const selectedDevice = ref<DeviceResponseApi | null>(null);
const isEditMode = ref(false);
const editableConfigs = ref<Record<string, DeviceConfig>>({});
const originalConfigs = ref<Record<string, DeviceConfig>>({});

// Ref to DeviceDetailDialog component
const deviceDetailDialogRef = ref<InstanceType<
  typeof DeviceDetailDialog
> | null>(null);

// Temporary filter state (before applying)
const tempDeviceSearch = ref("");
const tempSelectedTypeFilters = ref<string[]>([]);
const tempSelectedFilters = ref<string[]>([]);

// Applied filter state (actual filters being used)
const appliedDeviceSearch = ref("");
const appliedSelectedTypeFilters = ref<string[]>([]);
const appliedSelectedFilters = ref<string[]>([]);

// Table headers
const deviceHeaders = [
  { title: "ชื่ออุปกรณ์", key: "name", sortable: true },
  { title: "ประเภท", key: "type", sortable: true },
  { title: "สถานะ", key: "status", sortable: true },
  { title: "ออนไลน์ล่าสุด", key: "last_online", sortable: false },
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
      JSON.stringify(appliedSelectedFilters.value)
  );
});

// Computed to check if any filters are active
const _hasActiveFilters = computed(() => {
  return (
    tempDeviceSearch.value.trim() !== "" ||
    tempSelectedTypeFilters.value.length > 0 ||
    tempSelectedFilters.value.length > 0
  );
});

// Computed properties
const filteredDevices = computed(() => apiDevices.value);

const selectedDevicesCount = computed(() => selectedDevices.value.length);

// Apply filters function - now calls API with search params
const applyFilters = async () => {
  appliedDeviceSearch.value = tempDeviceSearch.value;
  appliedSelectedTypeFilters.value = [...tempSelectedTypeFilters.value];
  appliedSelectedFilters.value = [...tempSelectedFilters.value];

  // Build query object for API
  const query: Record<string, string> = {};

  if (appliedDeviceSearch.value.trim()) {
    query.search = appliedDeviceSearch.value.trim();
  }

  if (appliedSelectedTypeFilters.value.length === 1) {
    const typeFilter = appliedSelectedTypeFilters.value[0];
    query.type = typeof typeFilter === "object" ? typeFilter.value : typeFilter;
  }

  if (appliedSelectedFilters.value.length === 1) {
    const statusFilter = appliedSelectedFilters.value[0];
    query.status =
      typeof statusFilter === "object" ? statusFilter.value : statusFilter;
  }

  // Call API with filters
  await searchDevices({
    query: Object.keys(query).length > 0 ? query : undefined,
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "desc",
  });
};

// Clear all filters
const clearAllFilters = async () => {
  tempDeviceSearch.value = "";
  tempSelectedTypeFilters.value = [];
  tempSelectedFilters.value = [];
  appliedDeviceSearch.value = "";
  appliedSelectedTypeFilters.value = [];
  appliedSelectedFilters.value = [];

  // Reset to initial search
  await searchDevices({
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "desc",
  });
};

// Filter options from composable
const getTypeOptions = () => {
  return deviceTypeOptions.value;
};

const getFilterOptions = () => {
  return deviceStatusOptions.value;
};

const openDeviceDetailDialog = async (device: DeviceResponseApi) => {
  selectedDevice.value = device;
  originalConfigs.value = JSON.parse(
    JSON.stringify(device.configs?.sale || {})
  );
  editableConfigs.value = JSON.parse(
    JSON.stringify(device.configs?.sale || {})
  );
  isEditMode.value = false;
  showDeviceDetailDialog.value = true;
};

const toggleDeviceStatus = async () => {
  if (!selectedDevice.value) return;

  // const deviceId = selectedDevice.value.id;
  // const newStatus =
  //   selectedDevice.value.status === "DEPLOYED" ? "DISABLED" : "DEPLOYED";

  try {
    // await setDeviceStatus(deviceId, { status: newStatus });

    // Refresh device data from API response (setDeviceStatus updates currentDevice)
    if (currentDevice.value) {
      selectedDevice.value = currentDevice.value;
    }

    // Refresh the devices list
    await applyFilters();
  } catch {
    // Error handling
  }
};

const applySystemConfig = () => {
  // TODO: Implement system config application logic
  showApplySystemConfigDialog.value = false;
};

const applyDeviceConfig = async () => {
  if (!selectedDevice.value || !deviceDetailDialogRef.value) return;

  // Clear previous error
  applyDeviceConfigError.value = "";

  try {
    // Get both status and config payloads from the dialog component
    const statusPayload = deviceDetailDialogRef.value.getStatusChangePayload();
    const configPayload = deviceDetailDialogRef.value.getSavePayload();

    // Check if there are any changes at all
    const hasConfigChanges = configPayload.configs && Object.keys(configPayload.configs).length > 0;
    const hasStatusChange = statusPayload.status !== selectedDevice.value.status;

    if (!hasConfigChanges && !hasStatusChange) {
      return;
    }

    let updatedDevice = null;

    // Update device with config changes and current status
    updatedDevice = await updateDeviceConfigs(
      selectedDevice.value.id,
      configPayload,
      statusPayload.status as EnumDeviceStatus
    );

    // Refresh selectedDevice with the API response to update dialog
    if (updatedDevice) {
      selectedDevice.value = updatedDevice;
    }

    showApplyDeviceConfigDialog.value = false;
    isEditMode.value = false;

    // Reset dialog to view mode instead of closing it
    deviceDetailDialogRef.value.resetToViewMode();

    // Refresh the devices list
    await applyFilters();
  } catch {
    // Use the error from useDevice composable (already formatted in Thai)
    applyDeviceConfigError.value =
      apiError.value ||
      "ไม่สามารถบันทึกการตั้งค่าอุปกรณ์ได้ กรุณาลองใหม่อีกครั้ง";
  }
};

// Handle device updated event (e.g., when device name is changed)
const handleDeviceUpdated = async (updatedDevice: DeviceResponseApi) => {
  // Update selectedDevice with the device data received from event
  selectedDevice.value = updatedDevice;

  // Refresh the devices list
  await applyFilters();
};

// Initialize on mount
onMounted(async () => {
  await searchDevices({
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "desc",
  });
});
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
