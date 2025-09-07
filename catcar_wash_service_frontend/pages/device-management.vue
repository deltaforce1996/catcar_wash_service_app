<template>
  <div>
    <!-- Header Section -->
    <h1 class="text-h4 font-weight-bold mb-1">จัดการอุปกรณ์</h1>

    <!-- Device Type Tabs -->
    <v-tabs v-model="activeDeviceType" color="primary" class="mb-6">
      <v-tab value="WASH">เครื่องล้าง</v-tab>
      <v-tab value="DRYING">เครื่องอบแห้ง</v-tab>
    </v-tabs>

    <!-- Main Content Row -->
    <!-- System Configuration Panel -->
    <v-card elevation="2" rounded="lg">
      <v-card-title>
        <h2 class="text-h5 font-weight-bold">การกำหนดค่าระบบ</h2>
      </v-card-title>
      <v-card-text>
        <!-- Search Bar for System Config -->
        <v-text-field
          v-model="systemConfigSearch"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          placeholder="ค้นหาการตั้งค่าระบบ"
          hide-details
          clearable
          class="mb-4"
        />

        <!-- System Config Placeholder -->
        <div class="system-config-placeholder">
          <v-sheet
            color="grey-lighten-4"
            rounded="lg"
            height="100"
            class="d-flex align-center justify-center"
          >
            <span class="text-grey-darken-1">พื้นที่การตั้งค่าระบบ</span>
          </v-sheet>
        </div>
      </v-card-text>

      <!-- Device Data Table -->
      <v-card-title class="d-flex justify-space-between align-center">
        <h2 class="text-h5 font-weight-bold">รายการอุปกรณ์</h2>
        <v-chip variant="tonal" color="primary">
          {{ selectedDevicesCount }} /
          {{ filteredDevices.length }} อุปกรณ์ที่เลือก
        </v-chip>
      </v-card-title>

      <!-- Device Filter Section -->
      <v-card-text class="pb-2">
        <v-row>
          <!-- Device Search -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model="deviceSearch"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              placeholder="ค้นหาด้วยชื่ออุปกรณ์ หรือรหัสเครื่อง"
              hide-details
              clearable
            />
          </v-col>

          <!-- Device Filter Dropdown -->
          <v-col cols="12" md="6">
            <v-combobox
              v-model="selectedFilters"
              :items="getFilterOptions()"
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
                  {{ item.raw }}
                </v-chip>
              </template>
            </v-combobox>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Data Table -->
      <v-data-table
        v-model="selectedDevices"
        :headers="deviceHeaders"
        :items="filteredDevices"
        :items-per-page="10"
        class="elevation-0"
        hover
        show-select
        show-expand
        return-object
        item-value="id"
      >
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
        <template #expanded-row="{ item }">
          <td :colspan="deviceHeaders.length + 2" class="pa-4">
            <v-card flat>
              <v-card-text class="pa-3">
                <!-- Compact Device Info Header -->
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="d-flex align-center" style="gap: 24px">
                    <v-chip
                      color="info"
                      size="small"
                      variant="tonal"
                      class="px-3"
                    >
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
                          <div
                            class="d-flex justify-space-between align-start mb-1"
                          >
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
                          <div
                            class="d-flex align-center justify-space-between"
                          >
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
              </v-card-text>
            </v-card>
          </td>
        </template>
      </v-data-table>

      <!-- Apply System Config Button -->
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="primary"
          :disabled="selectedDevicesCount === 0"
          variant="elevated"
          size="large"
          prepend-icon="mdi-check-circle"
          class="px-6"
          @click="showApplySystemConfigDialog = true"
        >
          นำการตั้งค่าไปใช้
        </v-btn>
      </v-card-actions>
    </v-card>

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

// Reactive state
const activeDeviceType = ref<"WASH" | "DRYING">("WASH");
const systemConfigSearch = ref("");
const deviceSearch = ref("");
const selectedFilters = ref<string[]>([]);
const selectedDevices = ref<Device[]>([]);
const showApplySystemConfigDialog = ref(false);
const showDeviceDetailDialog = ref(false);
const showApplyDeviceConfigDialog = ref(false);
const selectedDevice = ref<Device | null>(null);
const isEditMode = ref(false);
const editableConfigs = ref<Record<string, DeviceConfig>>({});
const originalConfigs = ref<Record<string, DeviceConfig>>({});

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

// Computed properties
const filteredDevices = computed(() => {
  let filtered = allDevices.value.filter(
    (device) => device.type === activeDeviceType.value
  );

  // Search filter
  if (deviceSearch.value && deviceSearch.value.trim()) {
    const query = deviceSearch.value.toLowerCase();
    filtered = filtered.filter(
      (device) =>
        device.name.toLowerCase().includes(query) ||
        device.id.toLowerCase().includes(query)
    );
  }

  // Status filter
  if (selectedFilters.value.length > 0) {
    filtered = filtered.filter((device) =>
      selectedFilters.value.includes(device.status)
    );
  }

  return filtered;
});

const selectedDevicesCount = computed(() => selectedDevices.value.length);

// Methods
const getFilterOptions = () => {
  const statuses = [
    ...new Set(
      allDevices.value
        .filter((device) => device.type === activeDeviceType.value)
        .map((device) => device.status)
    ),
  ];
  return statuses;
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

// Clear selected devices when switching tabs
watch(activeDeviceType, () => {
  selectedDevices.value = [];
  selectedFilters.value = [];
  deviceSearch.value = "";
});
</script>

<style scoped>
.system-config-placeholder {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 16px;
}
</style>
