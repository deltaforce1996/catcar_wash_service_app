<template>
  <div>
    <!-- Header Section -->
    <div class="d-flex justify-space-between align-center flex-wrap mb-5">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">จับคู่อุปกรณ์</h1>
      </div>
    </div>

    <!-- Stepper Card -->
    <v-card elevation="2" rounded="lg">
      <!-- Screen Reader Announcement for Current Step (Accessibility) -->
      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {{
          `ขั้นตอนที่ ${currentStep} จาก ${stepperItems.length}: ${
            stepperItems[currentStep - 1]?.title
          }`
        }}
      </div>

      <v-stepper
        v-model="currentStep"
        alt-labels
        hide-actions
        :items="stepperItems"
        elevation="0"
        aria-label="ขั้นตอนการจับคู่อุปกรณ์ 4 ขั้นตอน"
      >
        <!-- Step 1: Scan/Select Device -->
        <template #[`item.1`]>
          <v-card-text class="pa-6">
            <!-- Scanning Control -->
            <div class="mb-6">
              <div class="d-flex justify-space-between align-center mb-4">
                <h2 class="text-h6 font-weight-bold">สแกนอุปกรณ์</h2>
                <v-btn
                  :color="isScanning ? 'error' : 'primary'"
                  :loading="isScanning"
                  size="large"
                  @click="toggleScanning"
                >
                  <v-icon class="mr-2">
                    {{ isScanning ? "mdi-stop" : "mdi-radar" }}
                  </v-icon>
                  {{
                    isScanning
                      ? `กำลังสแกน... (${remainingTime} วินาที)`
                      : "เริ่มสแกนอุปกรณ์"
                  }}
                </v-btn>
              </div>

              <!-- Connection Status -->
              <v-alert
                v-if="pairingState.error"
                type="error"
                variant="tonal"
                closable
                class="mb-4"
                @click:close="clearPairingError"
              >
                {{ pairingState.error }}
              </v-alert>

              <div class="d-flex align-center ga-2 mb-4">
                <v-chip
                  :color="isPairingConnected ? 'success' : 'error'"
                  size="small"
                  variant="tonal"
                >
                  <v-icon size="small" class="mr-1">
                    {{
                      isPairingConnected
                        ? "mdi-check-circle"
                        : "mdi-close-circle"
                    }}
                  </v-icon>
                  {{ isPairingConnected ? "เชื่อมต่อแล้ว" : "ไม่ได้เชื่อมต่อ" }}
                </v-chip>
                <v-chip size="small" variant="tonal" color="primary">
                  อุปกรณ์ที่พบ: {{ detectedDevices.length }}
                </v-chip>
              </div>
            </div>

            <!-- Device Selection -->
            <div v-if="detectedDevices.length > 0">
              <h3 class="text-subtitle-1 font-weight-medium mb-3">
                เลือกอุปกรณ์ที่ต้องการจับคู่
              </h3>
              <!-- Scrollable Container -->
              <v-sheet
                class="overflow-y-auto overflow-x-hidden pa-1 pr-2"
                :style="{
                  maxHeight: $vuetify.display.xs
                    ? 'calc(100vh - 550px)'
                    : $vuetify.display.sm
                    ? 'calc(100vh - 530px)'
                    : 'calc(100vh - 510px)',
                }"
                color="transparent"
              >
                <v-radio-group v-model="selectedDevice" hide-details>
                  <v-row>
                    <v-col
                      v-for="device in detectedDevices"
                      :key="device.pin"
                      cols="12"
                      md="6"
                      lg="4"
                    >
                      <v-card
                        variant="outlined"
                        :color="
                          selectedDevice?.pin === device.pin
                            ? 'primary'
                            : undefined
                        "
                        hover
                        @click="selectedDevice = device"
                      >
                        <v-card-text class="pa-4">
                          <div
                            class="d-flex align-center justify-space-between mb-3"
                          >
                            <v-radio :value="device" hide-details />
                            <v-chip
                              color="primary"
                              size="small"
                              variant="tonal"
                            >
                              PIN: {{ device.pin }}
                            </v-chip>
                          </div>

                          <v-list density="compact" class="bg-transparent">
                            <v-list-item class="px-0">
                              <v-list-item-title
                                class="text-caption text-medium-emphasis"
                              >
                                Device ID
                              </v-list-item-title>
                              <v-list-item-subtitle
                                class="text-body-2 font-family-monospace"
                              >
                                {{ device.device_id }}
                              </v-list-item-subtitle>
                            </v-list-item>

                            <v-list-item class="px-0">
                              <v-list-item-title
                                class="text-caption text-medium-emphasis"
                              >
                                MAC Address
                              </v-list-item-title>
                              <v-list-item-subtitle
                                class="text-body-2 font-family-monospace"
                              >
                                {{ device.mac_address }}
                              </v-list-item-subtitle>
                            </v-list-item>

                            <v-list-item class="px-0">
                              <v-list-item-title
                                class="text-caption text-medium-emphasis"
                              >
                                Chip ID
                              </v-list-item-title>
                              <v-list-item-subtitle
                                class="text-body-2 font-family-monospace"
                              >
                                {{ device.chip_id }}
                              </v-list-item-subtitle>
                            </v-list-item>

                            <v-list-item class="px-0">
                              <v-list-item-title
                                class="text-caption text-medium-emphasis"
                              >
                                Firmware
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-body-2">
                                {{ device.firmware_version }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-radio-group>
              </v-sheet>
            </div>

            <!-- Empty State -->
            <v-card
              v-else
              variant="outlined"
              class="text-center pa-8"
              color="surface-container"
            >
              <v-icon size="80" color="grey-darken-1" class="mb-4">
                mdi-devices-off
              </v-icon>
              <h3 class="text-h6 font-weight-medium mb-2">ไม่พบอุปกรณ์</h3>
              <p class="text-body-2 text-medium-emphasis">
                กรุณากดปุ่ม "เริ่มสแกนอุปกรณ์" เพื่อค้นหาอุปกรณ์ที่พร้อมจับคู่
              </p>
            </v-card>
          </v-card-text>
        </template>

        <!-- Step 2: Select User -->
        <template #[`item.2`]>
          <v-card-text class="pa-6">
            <h2 class="text-h6 font-weight-bold mb-4">เลือกลูกค้า</h2>

            <!-- Search Bar -->
            <v-text-field
              v-model="userSearchQuery"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              placeholder="ค้นหาลูกค้าด้วยชื่อ, อีเมล, เบอร์โทร"
              hide-details
              clearable
              class="mb-4"
              @keyup.enter="searchForUsers"
            />

            <div class="d-flex ga-2 mb-4">
              <v-btn color="primary" @click="searchForUsers">
                <v-icon class="mr-2">mdi-magnify</v-icon>
                ค้นหา
              </v-btn>
              <v-btn variant="outlined" @click="clearUserSearch">
                <v-icon class="mr-2">mdi-refresh</v-icon>
                ล้างการค้นหา
              </v-btn>
            </div>

            <!-- Loading State -->
            <div v-if="isUserSearching" class="text-center pa-8">
              <v-progress-circular indeterminate color="primary" size="64" />
              <p class="text-body-2 text-medium-emphasis mt-4">
                กำลังค้นหาลูกค้า...
              </p>
            </div>

            <!-- User List -->
            <div v-else-if="users.length > 0">
              <v-radio-group v-model="selectedUser" hide-details>
                <v-card variant="outlined">
                  <v-list>
                    <v-list-item
                      v-for="(user, index) in users"
                      :key="user.id"
                      :active="selectedUser?.id === user.id"
                      :color="
                        selectedUser?.id === user.id ? 'primary' : undefined
                      "
                      @click="selectedUser = user"
                    >
                      <template #prepend>
                        <v-radio :value="user" hide-details class="mr-2" />
                      </template>

                      <v-list-item-title class="text-body-1 font-weight-medium">
                        {{ user.fullname }}
                      </v-list-item-title>
                      <v-list-item-subtitle
                        v-if="user.custom_name"
                        class="text-body-2"
                      >
                        {{ user.custom_name }}
                      </v-list-item-subtitle>

                      <v-divider v-if="index < users.length - 1" />
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-radio-group>

              <!-- Pagination -->
              <div class="d-flex justify-space-between align-center mt-4">
                <div class="text-body-2 text-medium-emphasis">
                  แสดง {{ totalUsers }} รายการทั้งหมด
                </div>
                <div class="d-flex align-center ga-2">
                  <v-btn
                    variant="outlined"
                    size="small"
                    :disabled="currentUserPage <= 1"
                    @click="previousUserPage"
                  >
                    <v-icon>mdi-chevron-left</v-icon>
                    ก่อนหน้า
                  </v-btn>

                  <div class="d-flex align-center ga-1">
                    <span class="text-body-2">หน้า</span>
                    <v-chip variant="tonal" color="primary" size="small">
                      {{ currentUserPage }} / {{ totalUserPages }}
                    </v-chip>
                  </div>

                  <v-btn
                    variant="outlined"
                    size="small"
                    :disabled="currentUserPage >= totalUserPages"
                    @click="nextUserPage"
                  >
                    ถัดไป
                    <v-icon>mdi-chevron-right</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <v-card
              v-else
              variant="outlined"
              class="text-center pa-8"
              color="surface-container"
            >
              <v-icon size="80" color="grey-darken-1" class="mb-4">
                mdi-account-off
              </v-icon>
              <h3 class="text-h6 font-weight-medium mb-2">ไม่พบลูกค้า</h3>
              <p class="text-body-2 text-medium-emphasis">
                กรุณาค้นหาลูกค้าหรือลองใช้คำค้นหาอื่น
              </p>
            </v-card>
          </v-card-text>
        </template>

        <!-- Step 3: Confirmation -->
        <template #[`item.3`]>
          <v-card-text class="pa-6">
            <h2 class="text-h6 font-weight-bold mb-4">ยืนยันข้อมูล</h2>

            <!-- Error Alert -->
            <v-alert
              v-if="createDeviceError"
              type="error"
              variant="tonal"
              closable
              class="mb-4"
              @click:close="createDeviceError = null"
            >
              <v-alert-title>เกิดข้อผิดพลาด</v-alert-title>
              {{ createDeviceError }}
            </v-alert>

            <v-row>
              <!-- Device Information -->
              <v-col cols="12" sm="12" md="6">
                <v-card elevation="1" class="h-100">
                  <v-card-title class="d-flex align-center py-4">
                    <v-icon class="mr-2" color="primary">mdi-devices</v-icon>
                    <span class="text-subtitle-1 font-weight-bold"
                      >ข้อมูลอุปกรณ์</span
                    >
                  </v-card-title>
                  <v-divider />
                  <v-card-text class="pt-4">
                    <v-list density="compact" class="bg-transparent">
                      <v-list-item class="px-0">
                        <v-list-item-title
                          class="text-caption text-medium-emphasis"
                        >
                          PIN
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip
                            color="primary"
                            variant="tonal"
                            size="small"
                            class="font-weight-bold"
                          >
                            {{ selectedDevice?.pin }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item class="px-0">
                        <v-list-item-title
                          class="text-caption text-medium-emphasis"
                        >
                          Device ID
                        </v-list-item-title>
                        <v-list-item-subtitle
                          class="text-body-2 font-family-monospace"
                        >
                          {{ selectedDevice?.device_id }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item class="px-0">
                        <v-list-item-title
                          class="text-caption text-medium-emphasis"
                        >
                          MAC Address
                        </v-list-item-title>
                        <v-list-item-subtitle
                          class="text-body-2 font-family-monospace"
                        >
                          {{ selectedDevice?.mac_address }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item class="px-0">
                        <v-list-item-title
                          class="text-caption text-medium-emphasis"
                        >
                          Chip ID
                        </v-list-item-title>
                        <v-list-item-subtitle
                          class="text-body-2 font-family-monospace"
                        >
                          {{ selectedDevice?.chip_id }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item class="px-0">
                        <v-list-item-title
                          class="text-caption text-medium-emphasis"
                        >
                          Firmware
                        </v-list-item-title>
                        <v-list-item-subtitle class="text-body-2">
                          {{ selectedDevice?.firmware_version }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>

                    <v-divider class="my-3" />

                    <v-list density="compact" class="bg-transparent">
                      <v-list-item class="px-0">
                        <v-list-item-title
                          class="text-caption text-medium-emphasis"
                        >
                          ชื่ออุปกรณ์ที่จะสร้าง
                        </v-list-item-title>
                        <v-list-item-subtitle
                          class="text-body-1 font-weight-bold text-primary"
                        >
                          อุปกรณ์ใหม่-{{ selectedDevice?.device_id }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Customer Information -->
              <v-col cols="12" sm="12" md="6">
                <v-card elevation="1" class="h-100">
                  <v-card-title class="d-flex align-center py-4">
                    <v-icon class="mr-2" color="primary">mdi-account</v-icon>
                    <span class="text-subtitle-1 font-weight-bold"
                      >ข้อมูลลูกค้า</span
                    >
                  </v-card-title>
                  <v-divider />
                  <v-card-text class="pt-4">
                    <v-list density="compact" class="bg-transparent">
                      <v-list-item class="px-0">
                        <v-list-item-title
                          class="text-caption text-medium-emphasis"
                        >
                          ชื่อ
                        </v-list-item-title>
                        <v-list-item-subtitle
                          class="text-body-1 font-weight-medium"
                        >
                          {{ selectedUser?.fullname }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item
                        v-if="selectedUser?.custom_name"
                        class="px-0"
                      >
                        <v-list-item-title
                          class="text-caption text-medium-emphasis"
                        >
                          ชื่อเรียก
                        </v-list-item-title>
                        <v-list-item-subtitle class="text-body-2">
                          {{ selectedUser?.custom_name }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item class="px-0">
                        <v-list-item-title
                          class="text-caption text-medium-emphasis"
                        >
                          อีเมล
                        </v-list-item-title>
                        <v-list-item-subtitle class="text-body-2">
                          {{ selectedUser?.email }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="selectedUser?.phone" class="px-0">
                        <v-list-item-title
                          class="text-caption text-medium-emphasis"
                        >
                          เบอร์โทร
                        </v-list-item-title>
                        <v-list-item-subtitle class="text-body-2">
                          {{ selectedUser?.phone }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Warning Card -->
            <v-card variant="tonal" color="warning" class="mt-6" border>
              <v-card-text class="pa-4">
                <div class="d-flex align-start ga-3">
                  <v-avatar color="warning" size="40" rounded="lg">
                    <v-icon color="on-warning" size="24">mdi-alert</v-icon>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <p class="text-body-1 font-weight-bold mb-2">
                      โปรดตรวจสอบข้อมูลให้ถูกต้อง
                    </p>
                    <p class="text-body-2">
                      เมื่อกดยืนยันแล้ว อุปกรณ์จะถูกจับคู่กับลูกค้าที่เลือกทันที
                    </p>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-card-text>
        </template>

        <!-- Step 4: Success -->
        <template #[`item.4`]>
          <v-card-text class="pa-6 text-center">
            <v-icon size="120" color="success" class="mb-4">
              mdi-check-circle-outline
            </v-icon>

            <h2 class="text-h5 font-weight-bold mb-2">จับคู่อุปกรณ์สำเร็จ!</h2>
            <p class="text-body-1 text-medium-emphasis mb-6">
              ระบบได้จับคู่อุปกรณ์กับลูกค้าเรียบร้อยแล้ว
            </p>

            <!-- Summary -->
            <v-card
              variant="outlined"
              class="text-left mb-6 mx-auto"
              max-width="600"
            >
              <v-card-text>
                <v-list density="compact" class="bg-transparent">
                  <v-list-item>
                    <v-list-item-title
                      class="text-caption text-medium-emphasis"
                    >
                      อุปกรณ์
                    </v-list-item-title>
                    <v-list-item-subtitle
                      class="text-body-2 font-weight-medium"
                    >
                      อุปกรณ์ใหม่-{{ createdDeviceId }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title
                      class="text-caption text-medium-emphasis"
                    >
                      ลูกค้า
                    </v-list-item-title>
                    <v-list-item-subtitle
                      class="text-body-2 font-weight-medium"
                    >
                      {{ selectedUser?.fullname }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <v-btn color="primary" size="x-large" @click="connectAnotherDevice">
              <v-icon class="mr-2">mdi-plus-circle</v-icon>
              เชื่อมต่ออุปกรณ์อื่น
            </v-btn>
          </v-card-text>
        </template>
      </v-stepper>

      <!-- Unified Navigation Actions -->
      <v-card-actions v-if="currentStep < 4" class="pa-6 pt-0">
        <v-btn
          v-if="currentStep > 1"
          variant="text"
          size="large"
          :disabled="isCreatingDevice"
          @click="goToPreviousStep"
        >
          <v-icon class="mr-2">mdi-chevron-left</v-icon>
          ย้อนกลับ
        </v-btn>
        <v-spacer />
        <v-btn
          v-if="currentStep === 1"
          variant="elevated"
          color="primary"
          size="large"
          :disabled="!selectedDevice"
          @click="goToStep2"
        >
          ถัดไป
          <v-icon class="ml-2">mdi-chevron-right</v-icon>
        </v-btn>
        <v-btn
          v-else-if="currentStep === 2"
          variant="elevated"
          color="primary"
          size="large"
          :disabled="!selectedUser"
          @click="currentStep = 3"
        >
          ถัดไป
          <v-icon class="ml-2">mdi-chevron-right</v-icon>
        </v-btn>
        <v-btn
          v-else-if="currentStep === 3"
          variant="elevated"
          color="success"
          size="large"
          :loading="isCreatingDevice"
          @click="confirmPairing"
        >
          <v-icon class="mr-2">mdi-check-circle</v-icon>
          ยืนยันการจับคู่
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import type { DeviceRegistrationSession } from "~/services/apis/device-api.service";
import type { UserResponseApi } from "~/services/apis/user-api.service";
import { useDevicePairing } from "~/composables/useDevicePairing";
import { useDevice } from "~/composables/useDevice";
import { useUser } from "~/composables/useUser";
import { useAuth } from "~/composables/useAuth";

// Define page metadata
definePageMeta({
  layout: "default",
  title: "จับคู่อุปกรณ์",
});

const baseURL: string = "http://localhost:3000";

// Composables
const {
  state: pairingState,
  isConnected: isPairingConnected,
  startScanning,
  stopScanning,
  clearError: clearPairingError,
} = useDevicePairing(baseURL);

const {
  createDevice,
  isCreating: isCreatingDevice,
  error: deviceError,
} = useDevice();

const {
  users,
  isSearching: isUserSearching,
  searchUsers,
  totalUsers,
  totalPages: totalUserPages,
  currentSearchParams,
  goToPage: goToUserPage,
} = useUser();

const { user: authUser } = useAuth();

// Stepper configuration
const currentStep = ref(1);
const stepperItems = [
  { title: "สแกนอุปกรณ์", value: 1 },
  { title: "เลือกลูกค้า", value: 2 },
  { title: "ยืนยันข้อมูล", value: 3 },
  { title: "เสร็จสิ้น", value: 4 },
];

// Step 1: Device scanning
const detectedDevices = ref<DeviceRegistrationSession[]>([]);
const selectedDevice = ref<DeviceRegistrationSession | null>(null);
const isScanning = ref(false);
const remainingTime = ref(60);
let scanTimer: NodeJS.Timeout | null = null;

const toggleScanning = () => {
  if (isScanning.value) {
    stopDeviceScanning();
  } else {
    startDeviceScanning();
  }
};

const startDeviceScanning = () => {
  isScanning.value = true;
  remainingTime.value = 60;

  startScanning({
    onConnected: () => {
      console.log("Connected to device registration service");
    },
    onDisconnected: () => {
      console.log("Disconnected from device registration service");
      isScanning.value = false;
    },
    onRegistrationRequested: (data) => {
      console.log("Registration requested:", data);
      // Add to detected devices if not already present
      const exists = detectedDevices.value.some((d) => d.pin === data.pin);
      if (!exists) {
        detectedDevices.value.push(data);
      }
    },
    onSessionsUpdated: (sessions) => {
      console.log("Sessions updated:", sessions);
      // Update detected devices with initial sessions
      if (Array.isArray(sessions)) {
        sessions.forEach((session) => {
          const exists = detectedDevices.value.some(
            (d) => d.pin === session.pin
          );
          if (!exists) {
            detectedDevices.value.push(session);
          }
        });
      }
    },
    onError: (error) => {
      console.error("Scanning error:", error);
    },
  });

  // Start countdown timer
  scanTimer = setInterval(() => {
    remainingTime.value--;
    if (remainingTime.value <= 0) {
      stopDeviceScanning();
    }
  }, 1000);
};

const stopDeviceScanning = () => {
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }
  stopScanning();
  isScanning.value = false;
  remainingTime.value = 60;
};

const goToStep2 = () => {
  // Stop device scanning before proceeding to step 2
  stopDeviceScanning();
  currentStep.value = 2;
  // Auto-search users when entering step 2
  if (users.value.length === 0) {
    searchForUsers();
  }
};

const goToPreviousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

// Step 2: User selection
const userSearchQuery = ref("");
const selectedUser = ref<UserResponseApi | null>(null);
const currentUserPage = computed(() => currentSearchParams.value.page || 1);

const searchForUsers = async () => {
  await searchUsers({
    page: 1,
    limit: 10,
    query: userSearchQuery.value
      ? { search: userSearchQuery.value }
      : undefined,
  });
};

const clearUserSearch = async () => {
  userSearchQuery.value = "";
  await searchUsers({ page: 1, limit: 10 });
};

const nextUserPage = async () => {
  await goToUserPage(currentUserPage.value + 1);
};

const previousUserPage = async () => {
  await goToUserPage(currentUserPage.value - 1);
};

// Step 3: Confirmation and device creation
const createDeviceError = ref<string | null>(null);
const createdDeviceId = ref<string | null>(null);

const confirmPairing = async () => {
  if (!selectedDevice.value || !selectedUser.value || !authUser.value) {
    return;
  }

  createDeviceError.value = null;

  try {
    const deviceName = `อุปกรณ์ใหม่-${selectedDevice.value.device_id}`;
    const pairedDevicePin = selectedDevice.value.pin;

    await createDevice({
      id: selectedDevice.value.device_id,
      name: deviceName,
      type: "WASH",
      owner_id: selectedUser.value.id,
      register_by: authUser.value.id,
    });

    // Remove the successfully paired device from detectedDevices array
    detectedDevices.value = detectedDevices.value.filter(
      (device) => device.pin !== pairedDevicePin
    );

    // Success - move to step 4
    createdDeviceId.value = selectedDevice.value.device_id;
    currentStep.value = 4;
  } catch (error) {
    console.error("Failed to create device:", error);
    createDeviceError.value =
      deviceError.value || "ไม่สามารถสร้างอุปกรณ์ได้ กรุณาลองใหม่อีกครั้ง";
  }
};

// Step 4: Success and reset
const connectAnotherDevice = () => {
  // Clear selected device but keep detected devices
  selectedDevice.value = null;
  selectedUser.value = null;
  createDeviceError.value = null;
  createdDeviceId.value = null;

  // Reset to step 1
  currentStep.value = 1;
};

// Cleanup on unmount
onUnmounted(() => {
  if (scanTimer) {
    clearInterval(scanTimer);
  }
  stopScanning();
});

// Initialize users on mount
onMounted(() => {
  // Optional: Pre-load users if needed
});
</script>

<style scoped>
/* ============================================
   CUSTOM SCROLLBAR STYLES
   ============================================ */

/* Custom Scrollbar Styling for v-sheet */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.5);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.7);
}

/* Firefox Scrollbar */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.5)
    rgba(var(--v-theme-surface-variant), 0.3);
}

.font-family-monospace {
  font-family: "Roboto Mono", "Monaco", "Consolas", monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

/* ============================================
   ENHANCED STEPPER VISIBILITY STYLES
   ============================================ */

/* Base Stepper Window */
:deep(.v-stepper-window) {
  margin: 0 !important;
}

/* Base Stepper Item Padding */
:deep(.v-stepper-item) {
  padding: 12px 16px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Active Step Container Enhancement */
:deep(.v-stepper-item--selected) {
  background: rgba(var(--v-theme-primary), 0.15);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(245, 127, 42, 0.12);
}

/* Active Step Top Border Indicator */
:deep(.v-stepper-item--selected::before) {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgb(var(--v-theme-primary));
  border-radius: 12px 12px 0 0;
}

/* Active Step Number/Icon Circle */
:deep(.v-stepper-item--selected .v-avatar) {
  width: 52px !important;
  height: 52px !important;
  background-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 2px 8px rgba(245, 127, 42, 0.3), 0 0 0 0 rgba(245, 127, 42, 0.4);
  animation: stepper-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Pulse Animation for Active Step */
@keyframes stepper-pulse {
  0%,
  100% {
    box-shadow: 0 2px 8px rgba(245, 127, 42, 0.3),
      0 0 0 0 rgba(245, 127, 42, 0.4);
  }
  50% {
    box-shadow: 0 2px 8px rgba(245, 127, 42, 0.3),
      0 0 0 8px rgba(245, 127, 42, 0);
  }
}

/* Active Step Number/Icon Text */
:deep(.v-stepper-item--selected .v-avatar .v-icon),
:deep(.v-stepper-item--selected .v-avatar) {
  color: rgb(var(--v-theme-on-primary)) !important;
  font-weight: 700;
  font-size: 1.125rem;
}

/* Active Step Title */
:deep(.v-stepper-item--selected .v-stepper-item__title) {
  color: rgb(var(--v-theme-primary)) !important;
  font-weight: 700 !important;
  font-size: 0.9375rem !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Inactive Step Title - Reduced Emphasis */
:deep(.v-stepper-item:not(.v-stepper-item--selected) .v-stepper-item__title) {
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 500;
  opacity: 0.5;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Inactive Step Avatar */
:deep(
    .v-stepper-item:not(.v-stepper-item--selected):not(
        .v-stepper-item--complete
      )
      .v-avatar
  ) {
  width: 40px !important;
  height: 40px !important;
  background-color: rgb(var(--v-theme-surface-variant)) !important;
  opacity: 0.4;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Completed Step Styling */
:deep(.v-stepper-item--complete .v-avatar) {
  background-color: rgb(var(--v-theme-success)) !important;
  width: 40px !important;
  height: 40px !important;
  box-shadow: 0 1px 4px rgba(16, 185, 129, 0.3);
}

:deep(.v-stepper-item--complete .v-stepper-item__title) {
  color: rgb(var(--v-theme-success));
  font-weight: 600;
  opacity: 0.9;
}

/* Connector Line - Default */
:deep(.v-stepper-header .v-divider) {
  border-color: rgb(var(--v-theme-surface-variant));
  opacity: 0.3;
  border-width: 1px;
  transition: all 0.3s ease;
}

/* Active-to-Next Connector Line (Dashed) */
:deep(.v-stepper-item--selected + .v-divider) {
  border-color: rgb(var(--v-theme-primary));
  opacity: 0.7;
  border-width: 3px;
  border-style: dashed;
}

/* Completed Connector Lines (Solid) */
:deep(.v-stepper-item--complete + .v-divider) {
  border-color: rgb(var(--v-theme-success)) !important;
  opacity: 1;
  border-width: 2px;
  border-style: solid;
}

/* Hover State for Interactive Steps */
:deep(.v-stepper-item:not(.v-stepper-item--disabled):hover) {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 12px;
  cursor: pointer;
}

/* Focus Indicator for Keyboard Navigation (Accessibility) */
:deep(.v-stepper-item:focus-visible) {
  outline: 3px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 12px;
}

/* Smooth Animation for Step Transitions */
:deep(.v-stepper-item__avatar),
:deep(.v-stepper-item__title) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Mobile Responsiveness - Maintain visibility on small screens */
@media (max-width: 600px) {
  :deep(.v-stepper-item--selected .v-avatar) {
    width: 48px !important;
    height: 48px !important;
  }

  :deep(
      .v-stepper-item:not(.v-stepper-item--selected):not(
          .v-stepper-item--complete
        )
        .v-avatar
    ) {
    width: 36px !important;
    height: 36px !important;
  }

  :deep(.v-stepper-item--selected) {
    background: rgba(var(--v-theme-primary), 0.2);
  }

  :deep(.v-stepper-item--selected .v-stepper-item__title) {
    font-size: 0.875rem !important;
  }

  :deep(.v-stepper-item) {
    padding: 8px 12px;
  }

  :deep(.v-stepper-item--selected::before) {
    height: 2px;
  }
}

/* Tablet Responsiveness */
@media (min-width: 601px) and (max-width: 960px) {
  :deep(.v-stepper-item--selected .v-avatar) {
    width: 46px !important;
    height: 46px !important;
  }
}

/* ============================================
   ACCESSIBILITY STYLES
   ============================================ */

/* Screen Reader Only - For Accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Reduced Motion Support - Accessibility */
@media (prefers-reduced-motion: reduce) {
  :deep(.v-stepper-item--selected .v-avatar) {
    animation: none !important;
  }

  :deep(.v-stepper-item--selected + .v-divider) {
    animation: none !important;
  }

  :deep(.v-stepper-item),
  :deep(.v-stepper-item__avatar),
  :deep(.v-stepper-item__title) {
    transition: none !important;
  }
}
</style>
