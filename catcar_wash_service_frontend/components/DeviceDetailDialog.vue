<template>
  <!-- Device Detail Full Page Dialog -->
  <v-dialog
    v-model="showDialog"
    fullscreen
    transition="dialog-bottom-transition"
  >
    <v-card>
      <v-toolbar color="primary" dark>
        <v-btn icon="mdi-close" @click="closeDialog" />
        <v-toolbar-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-cog</v-icon>
          การตั้งค่าอุปกรณ์ - {{ device?.name }}
        </v-toolbar-title>
        <v-spacer />
      </v-toolbar>

      <v-container class="pa-6">
        <v-row>
          <!-- Device Image and Info Section -->
          <v-col cols="12" lg="4">
            <v-card color="surface-container-low" elevation="3" rounded="lg">
              <v-card-text class="pa-4">
                <!-- Device Image -->
                <div class="text-center mb-4">
                  <v-avatar
                    size="120"
                    color="surface-container-high"
                    class="mb-3"
                  >
                    <v-icon size="60" color="grey-darken-1">
                      {{
                        device?.type === "WASH"
                          ? "mdi-car-wash"
                          : "mdi-air-filter"
                      }}
                    </v-icon>
                  </v-avatar>
                  <h3 class="text-h5 font-weight-bold">{{ device?.name }}</h3>
                  <v-chip
                    :color="getTypeColor(device?.type || '')"
                    size="small"
                    variant="tonal"
                    class="mt-2"
                  >
                    {{ getTypeLabel(device?.type || "") }}
                  </v-chip>
                </div>

                <!-- Device Status -->
                <v-card flat color="surface-container" class="mb-4">
                  <v-card-text class="pa-3">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="font-weight-medium">สถานะ:</span>
                      <v-chip
                        :color="getStatusColor(device?.status || '')"
                        size="small"
                        variant="tonal"
                      >
                        {{ getStatusLabel(device?.status || "") }}
                      </v-chip>
                    </div>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="font-weight-medium">รหัสอุปกรณ์:</span>
                      <span class="text-body-2">{{
                        device?.id.slice(-8)
                      }}</span>
                    </div>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="font-weight-medium">เจ้าของ:</span>
                      <span class="text-body-2">{{
                        device?.owner.fullname
                      }}</span>
                    </div>
                    <div class="d-flex justify-space-between align-center">
                      <span class="font-weight-medium">ลงทะเบียนโดย:</span>
                      <span class="text-body-2">{{
                        device?.registered_by.name
                      }}</span>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Device Description -->
                <v-card flat color="info" variant="tonal">
                  <v-card-text class="pa-3">
                    <div class="d-flex align-start">
                      <v-icon class="mr-2 mt-1" size="20"
                        >mdi-information</v-icon
                      >
                      <div>
                        <div class="font-weight-medium mb-1">คำอธิบาย</div>
                        <p class="text-body-2 mb-0">
                          {{ getDeviceDescription(device?.type || "") }}
                        </p>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Configuration Section with Tabs -->
          <v-col cols="12" lg="8">
            <!-- Device Status Control Card (only in edit mode) -->

            <!-- Tabs Section -->
            <v-card
              color="surface-container-low"
              elevation="3"
              rounded="lg"
              class="d-flex flex-column"
              style="height: calc(100vh - 150px)"
            >
              <v-card-title class="pb-0">
                <v-tabs
                  v-model="currentTab"
                  color="primary"
                  class="flex-shrink-0"
                >
                  <v-tab value="logging">
                    <v-icon class="mr-2">mdi-file-document-outline</v-icon>
                    บันทึกการใช้งาน
                  </v-tab>
                  <v-tab value="state">
                    <v-icon class="mr-2">mdi-chart-line</v-icon>
                    สถานะระบบ
                  </v-tab>
                  <v-tab value="setup">
                    <v-icon class="mr-2">mdi-cog-outline</v-icon>
                    การตั้งค่า
                  </v-tab>
                </v-tabs>
                <v-divider class="flex-shrink-0" />
              </v-card-title>

              <v-card-text class="pa-4 overflow-y-auto">
                <v-tabs-window v-model="currentTab">
                  <!-- Setup Tab -->
                  <v-tabs-window-item value="setup">
                    <!-- Edit Mode Toggle -->
                    <v-card variant="text">
                      <v-card-title>
                        <v-icon class="mr-2" color="primary">mdi-power</v-icon>
                        <span>การควบคุมสถานะอุปกรณ์</span>
                      </v-card-title>

                      <v-divider />

                      <v-card-text>
                        <div class="d-flex align-center justify-space-between">
                          <div>
                            <h3 class="text-h6 font-weight-bold mb-1">
                              สถานะการทำงาน
                            </h3>
                            <p class="text-body-2 text-grey-darken-1 mb-0">
                              {{
                                device?.status === "DEPLOYED"
                                  ? "อุปกรณ์กำลังทำงานอยู่และพร้อมให้บริการ"
                                  : "อุปกรณ์หยุดทำงานชั่วคราว"
                              }}
                            </p>
                          </div>

                          <div class="d-flex align-center">
                            <span class="text-body-2 mr-3">
                              {{
                                device?.status === "DEPLOYED"
                                  ? "เปิดใช้งาน"
                                  : "ปิดใช้งาน"
                              }}
                            </span>
                            <v-switch
                              :model-value="device?.status === 'DEPLOYED'"
                              :color="
                                device?.status === 'DEPLOYED'
                                  ? 'success'
                                  : 'error'
                              "
                              hide-details
                              @update:model-value="$emit('toggleStatus')"
                            />
                          </div>
                        </div>

                        <v-alert
                          v-if="device?.status !== 'DEPLOYED'"
                          color="warning"
                          variant="tonal"
                          class="mt-4"
                          density="compact"
                        >
                          <v-icon class="mr-1">mdi-alert</v-icon>
                          เมื่อปิดใช้งาน ลูกค้าจะไม่สามารถใช้บริการอุปกรณ์นี้ได้
                        </v-alert>
                      </v-card-text>
                    </v-card>

                    <v-card variant="text" class="mt-4">
                      <v-card-title
                        class="d-flex justify-space-between align-center"
                      >
                        <div class="d-flex align-center">
                          <v-icon class="mr-2" color="primary">mdi-cog</v-icon>
                          <span>การตั้งค่าการขาย</span>
                        </div>

                        <div class="d-flex align-center ga-3">
                          <v-btn
                            :color="isEditMode ? 'warning' : 'info'"
                            variant="elevated"
                            @click="toggleEditMode"
                          >
                            <v-icon class="mr-1">
                              {{ isEditMode ? "mdi-eye" : "mdi-pencil" }}
                            </v-icon>
                            {{ isEditMode ? "ดูอย่างเดียว" : "แก้ไข" }}
                          </v-btn>

                          <!-- Save Button (only show in edit mode with changes) -->
                          <v-btn
                            v-if="isEditMode"
                            :color="hasConfigChanges ? 'success' : 'grey'"
                            :disabled="!hasConfigChanges"
                            variant="elevated"
                            @click="$emit('save')"
                          >
                            <v-icon class="mr-1">mdi-content-save</v-icon>
                            {{
                              hasConfigChanges
                                ? "บันทึก"
                                : "ไม่มีการเปลี่ยนแปลง"
                            }}
                          </v-btn>
                        </div>
                      </v-card-title>

                      <v-divider />

                      <v-card-text>
                        <v-list class="py-0">
                          <template
                            v-for="(config, key, index) in isEditMode
                              ? editableConfigs
                              : device?.configs.sale"
                            :key="key"
                          >
                            <v-list-item class="py-4 bg-surface-container-low">
                              <template #prepend>
                                <v-avatar
                                  size="40"
                                  :color="
                                    isEditMode && isConfigChanged(key)
                                      ? 'warning'
                                      : 'primary'
                                  "
                                  variant="tonal"
                                  class="mr-4"
                                >
                                  <v-icon size="20">
                                    {{ getConfigIcon(key) }}
                                  </v-icon>
                                </v-avatar>
                              </template>

                              <v-list-item-title
                                class="text-subtitle-1 font-weight-medium mb-1"
                              >
                                {{ config.description }}
                                <v-chip
                                  size="x-small"
                                  color="on-surface-variant"
                                  variant="tonal"
                                  class="ml-2"
                                >
                                  {{ key }}
                                </v-chip>
                              </v-list-item-title>

                              <v-list-item-subtitle
                                class="text-body-2 text-on-surface-variant"
                              >
                                {{ getConfigDescription(key) }}
                              </v-list-item-subtitle>

                              <template #append>
                                <div class="d-flex align-center">
                                  <!-- View Mode -->
                                  <div v-if="!isEditMode" class="text-right">
                                    <div
                                      class="text-h6 font-weight-bold text-primary mb-1"
                                    >
                                      {{ config.value }}
                                      <span
                                        class="text-body-2 text-on-surface-variant"
                                        >{{ config.unit }}</span
                                      >
                                    </div>
                                  </div>

                                  <!-- Edit Mode -->
                                  <div
                                    v-else
                                    class="d-flex align-center"
                                    style="width: 100%"
                                  >
                                    <div class="d-flex align-center">
                                      <v-text-field
                                        v-model.number="
                                          editableConfigs[key].value
                                        "
                                        type="number"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        :color="
                                          isConfigChanged(key)
                                            ? 'warning'
                                            : 'primary'
                                        "
                                        style="width: 70px; flex-shrink: 0"
                                        :aria-label="`${config.label} ค่า หน่วย ${config.unit}`"
                                      />
                                      <span class="mx-2">
                                        {{ config.unit }}
                                      </span>
                                    </div>
                                    <div class="d-flex align-center">
                                      <v-btn
                                        v-if="isConfigChanged(key)"
                                        icon="mdi-restore"
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                        @click="resetSingleConfig(key)"
                                      />
                                      <v-icon
                                        v-if="isConfigChanged(key)"
                                        color="warning"
                                        size="20"
                                        class="ml-2"
                                      >
                                        mdi-pencil-circle
                                      </v-icon>
                                    </div>
                                  </div>
                                </div>
                              </template>
                            </v-list-item>

                            <!-- Change indicator for edit mode -->
                            <div
                              v-if="isEditMode && isConfigChanged(key)"
                              class="px-6 pb-2 bg-surface-container-low"
                            >
                              <v-alert
                                color="warning"
                                variant="tonal"
                                density="compact"
                                class="text-caption"
                              >
                                <v-icon class="mr-1">mdi-information</v-icon>
                                โปรดกดบันทึก การเปลี่ยนแปลงจาก
                                {{ originalConfigs[key]?.value }}
                                {{ originalConfigs[key]?.unit }} เป็น
                                {{ editableConfigs[key].value }}
                                {{ editableConfigs[key].unit }}
                              </v-alert>
                            </div>

                            <!-- Divider between items (except last item) -->
                            <v-divider
                              v-if="
                                index <
                                Object.keys(device?.configs.sale || {}).length -
                                  1
                              "
                              class="mx-6"
                            />
                          </template>
                        </v-list>
                      </v-card-text>
                    </v-card>
                  </v-tabs-window-item>

                  <!-- Logging Tab -->
                  <v-tabs-window-item value="logging" class="pa-6">
                    <div class="text-center py-12">
                      <v-icon size="80" color="grey-lighten-1" class="mb-4">
                        mdi-file-document-outline
                      </v-icon>
                      <h3 class="text-h6 text-grey-darken-1 mb-2">
                        บันทึกการใช้งาน
                      </h3>
                      <p class="text-body-2 text-grey-darken-1">
                        ส่วนนี้จะแสดงประวัติการใช้งานอุปกรณ์<br >
                        (อยู่ในระหว่างการพัฒนา)
                      </p>
                    </div>
                  </v-tabs-window-item>

                  <!-- State Tab -->
                  <v-tabs-window-item value="state" class="pa-6">
                    <div class="text-center py-12">
                      <v-icon size="80" color="grey-lighten-1" class="mb-4">
                        mdi-chart-line
                      </v-icon>
                      <h3 class="text-h6 text-grey-darken-1 mb-2">สถานะระบบ</h3>
                      <p class="text-body-2 text-grey-darken-1">
                        ส่วนนี้จะแสดงสถานะการทำงานของอุปกรณ์แบบเรียลไทม์<br >
                        (อยู่ในระหว่างการพัฒนา)
                      </p>
                    </div>
                  </v-tabs-window-item>
                </v-tabs-window>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { Device, DeviceConfig } from "~/data/devices";

interface Props {
  modelValue: boolean;
  device: Device | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "save" | "toggleStatus"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local state
const isEditMode = ref(false);
const currentTab = ref("setup");
const editableConfigs = ref<Record<string, DeviceConfig>>({});
const originalConfigs = ref<Record<string, DeviceConfig>>({});

// Computed
const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const hasConfigChanges = computed(() => {
  return Object.keys(editableConfigs.value).some((key) => isConfigChanged(key));
});

const _configChangeCount = computed(() => {
  return Object.keys(editableConfigs.value).filter((key) =>
    isConfigChanged(key)
  ).length;
});

// Methods
const closeDialog = () => {
  showDialog.value = false;
  isEditMode.value = false;
  currentTab.value = "setup";
  editableConfigs.value = {};
  originalConfigs.value = {};
};

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (isEditMode.value && props.device) {
    editableConfigs.value = JSON.parse(
      JSON.stringify(props.device.configs.sale)
    );
  }
};

const resetSingleConfig = (key: string) => {
  if (originalConfigs.value[key]) {
    editableConfigs.value[key] = JSON.parse(
      JSON.stringify(originalConfigs.value[key])
    );
  }
};

const isConfigChanged = (key: string) => {
  return (
    originalConfigs.value[key]?.value !== editableConfigs.value[key]?.value
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "DEPLOYED":
      return "success";
    case "MAINTENANCE":
      return "warning";
    case "ERROR":
      return "error";
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

const getDeviceDescription = (type: string) => {
  switch (type) {
    case "WASH":
      return "เครื่องล้างรถอัตโนมัติที่มีระบบฉีดน้ำแรงดันสูง ระบบฟองสบู่ และการล้างด้วยแปรง นำมาใช้สำหรับทำความสะอาดรถยนต์และรถจักรยานยนต์อย่างมีประสิทธิภาพ";
    case "DRYING":
      return "เครื่องอบแห้งและฆ่าเชื้อโรคด้วยแสง UV และโอโซน เหมาะสำหรับการทำความสะอาดและฆ่าเชื้อโรคบนหมวกกันน็อค อุปกรณ์ป้องกัน และสิ่งของต่างๆ";
    default:
      return "อุปกรณ์สำหรับบริการล้างและทำความสะอาด";
  }
};

const getConfigIcon = (configKey: string) => {
  switch (configKey.toLowerCase()) {
    case "price":
    case "cost":
      return "mdi-cash";
    case "time":
    case "duration":
      return "mdi-clock-outline";
    case "water":
    case "pressure":
      return "mdi-water";
    case "temperature":
    case "temp":
      return "mdi-thermometer";
    case "speed":
    case "rpm":
      return "mdi-speedometer";
    case "power":
    case "watt":
      return "mdi-flash";
    default:
      return "mdi-cog";
  }
};

const getConfigDescription = (configKey: string) => {
  switch (configKey.toLowerCase()) {
    case "price":
      return "ค่าบริการต่อการใช้งานหนึ่งครั้ง";
    case "cost":
      return "ราคาบริการที่เรียกเก็บจากลูกค้า";
    case "time":
      return "ระยะเวลาที่ใช้ในการให้บริการ";
    case "duration":
      return "ความยาวของรอบการทำงาน";
    case "water":
      return "ปริมาณน้ำที่ใช้ในกระบวนการล้าง";
    case "pressure":
      return "แรงดันของน้ำที่ใช้ในการล้าง";
    case "temperature":
      return "อุณหภูมิของน้ำที่ใช้ในกระบวนการ";
    case "speed":
      return "ความเร็วในการหมุนของแปรงหรือเครื่องจักร";
    case "power":
      return "กำลังไฟฟ้าที่ใช้ในการทำงาน";
    default:
      return "การตั้งค่าสำหรับการทำงานของอุปกรณ์";
  }
};

// Watch for device changes to initialize configs
watch(
  () => props.device,
  (newDevice) => {
    if (newDevice) {
      originalConfigs.value = JSON.parse(
        JSON.stringify(newDevice.configs.sale)
      );
      editableConfigs.value = JSON.parse(
        JSON.stringify(newDevice.configs.sale)
      );
    }
  },
  { immediate: true }
);
</script>
