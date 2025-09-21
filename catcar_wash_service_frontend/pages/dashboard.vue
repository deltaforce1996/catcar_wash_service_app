<template>
  <div>
    <!-- Header Section -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center flex-wrap">
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">แดชบอร์ดยอดขาย</h1>
          </div>
          <div class="d-flex align-center ga-3 flex-wrap">
            <v-menu v-model="datePickerMenu">
              <template #activator="{ props }">
                <v-text-field
                  v-bind="props"
                  v-model="selectedDate"
                  readonly
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="date-picker"
                />
              </template>
              <v-date-picker
                v-model="selectedDateObject"
                @update:model-value="datePickerMenu = false"
              />
            </v-menu>
            <v-menu v-model="filterMenu" :close-on-content-click="false">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="outlined"
                  prepend-icon="mdi-filter-variant"
                  class="text-none"
                >
                  <template #default>
                    <span>กรองข้อมูล</span>
                    <v-chip
                      v-if="activeFilterCount > 0"
                      :text="activeFilterCount.toString()"
                      color="primary"
                      size="small"
                      class="ml-2"
                    />
                  </template>
                </v-btn>
              </template>

              <v-card
                class="pa-4"
                elevation="8"
                rounded="lg"
                min-width="320"
                max-width="400"
              >
                <v-card-title class="pa-0 mb-4">
                  <h3 class="text-h6 font-weight-bold">ตัวกรองข้อมูล</h3>
                </v-card-title>

                <v-card-text class="pa-0">
                  <div class="d-flex flex-column ga-4">
                    <!-- User ID Filter -->
                    <v-combobox
                      v-model="tempSelectedUserIds"
                      :items="userOptions"
                      label="ชื่อผู้ใช้"
                      prepend-inner-icon="mdi-account"
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
                          color="primary"
                          size="small"
                          variant="tonal"
                        >
                          {{ item.raw }}
                        </v-chip>
                      </template>
                    </v-combobox>

                    <!-- Payment Status Filter -->
                    <v-combobox
                      v-model="tempSelectedPaymentStatuses"
                      :items="paymentStatusOptions"
                      label="สถานะการชำระเงิน"
                      prepend-inner-icon="mdi-credit-card"
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
                          :color="getPaymentStatusColor(item.raw)"
                          size="small"
                          variant="tonal"
                        >
                          {{ item.raw }}
                        </v-chip>
                      </template>
                    </v-combobox>

                    <!-- Device Type Filter -->
                    <v-combobox
                      v-model="tempSelectedDeviceTypes"
                      :items="deviceTypeOptions"
                      label="ประเภทอุปกรณ์"
                      prepend-inner-icon="mdi-cog"
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
                          :color="getDeviceTypeColor(item.raw)"
                          size="small"
                          variant="tonal"
                        >
                          {{ item.raw }}
                        </v-chip>
                      </template>
                    </v-combobox>
                  </div>
                </v-card-text>

                <v-card-actions class="pa-0 mt-4">
                  <v-btn
                    variant="outlined"
                    size="small"
                    prepend-icon="mdi-refresh"
                    @click="resetPopoverFilters"
                  >
                    ล้างตัวกรอง
                  </v-btn>
                  <v-spacer />
                  <v-btn
                    variant="elevated"
                    color="primary"
                    size="small"
                    prepend-icon="mdi-check"
                    @click="applyPopoverFilters"
                  >
                    ยืนยันตัวกรอง
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
            <v-btn
              color="primary"
              prepend-icon="mdi-download"
              class="text-none"
            >
              ส่งออก
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- KPI Cards Section -->
    <v-row class="mb-8">
      <v-col v-for="(kpi, index) in kpiData" :key="index" cols="12" md="4">
        <KPICard
          :title="kpi.title"
          :value="kpi.value"
          :trend="kpi.trend"
          :chart-data="kpi.chartData"
          :chart-labels="kpi.chartLabels"
          :chart-id="kpi.chartId"
          :currency="kpi.currency"
        />
      </v-col>
    </v-row>

    <!-- Hourly Revenue Card Section -->
    <!-- <v-row class="mb-8">
      <v-col cols="12">
        <KPICard
          title="รายได้รายชั่วโมง"
          :value="dashboardData.hourlyRevenue.value"
          :trend="dashboardData.hourlyRevenue.trend"
          :chart-data="dashboardData.hourlyRevenue.chartData"
          :chart-labels="dashboardData.hourlyRevenue.chartLabels"
          chart-id="hourly-kpi"
          :currency="true"
        />
      </v-col>
    </v-row> -->

    <!-- Sales Detail Table -->
    <v-card elevation="2" rounded="lg">
      <v-card-title class="pa-6">
        <div class="d-flex justify-space-between align-center">
          <h2 class="text-h5 font-weight-bold">รายละเอียดการขาย</h2>
          <v-chip variant="tonal" color="primary">
            {{ filteredSalesData.length }} รายการ
          </v-chip>
        </div>
      </v-card-title>

      <!-- Filter Section -->
      <v-card-text class="pb-2">
        <v-row>
          <!-- Search Bar -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model="tempSearchQuery"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              placeholder="ค้นหาด้วยชื่อบริการ หรือรหัสเครื่อง"
              hide-details
              clearable
              aria-label="ค้นหาการขาย"
              role="searchbox"
            />
          </v-col>

          <!-- Time Range Picker -->
          <v-col cols="12" md="6">
            <div class="d-flex ga-2">
              <!-- Start Time Field -->
              <v-menu v-model="startTimeMenu" :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="formatTimeToString(tempStartTimeObj)"
                    readonly
                    prepend-inner-icon="mdi-clock-outline"
                    variant="outlined"
                    density="compact"
                    placeholder="เวลาเริ่ม"
                    hide-details
                    class="flex-1"
                  />
                </template>
                <v-card class="pa-4">
                  <div class="d-flex flex-column ga-3">
                    <div class="text-subtitle-2">เวลาเริ่มต้น</div>
                    <v-time-picker
                      v-model="tempStartTimeObj"
                      scrollable
                      :max="
                        tempEndTimeObj
                          ? formatTimeToString(tempEndTimeObj)
                          : '23:59'
                      "
                      class="time-picker-compact"
                    />
                    <div class="d-flex justify-end ga-2">
                      <v-btn
                        variant="text"
                        size="small"
                        @click="tempStartTimeObj = null"
                      >
                        ล้าง
                      </v-btn>
                      <v-btn
                        color="primary"
                        size="small"
                        @click="startTimeMenu = false"
                      >
                        ตกลง
                      </v-btn>
                    </div>
                  </div>
                </v-card>
              </v-menu>

              <!-- End Time Field -->
              <v-menu v-model="endTimeMenu" :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="formatTimeToString(tempEndTimeObj)"
                    readonly
                    prepend-inner-icon="mdi-clock-outline"
                    variant="outlined"
                    density="compact"
                    placeholder="เวลาสิ้นสุด"
                    hide-details
                    class="flex-1"
                  />
                </template>
                <v-card class="pa-4">
                  <div class="d-flex flex-column ga-3">
                    <div class="text-subtitle-2">เวลาสิ้นสุด</div>
                    <v-time-picker
                      v-model="tempEndTimeObj"
                      scrollable
                      :min="
                        tempStartTimeObj
                          ? formatTimeToString(tempStartTimeObj)
                          : '00:00'
                      "
                      class="time-picker-compact"
                    />
                    <div class="d-flex justify-end ga-2">
                      <v-btn
                        variant="text"
                        size="small"
                        @click="tempEndTimeObj = null"
                      >
                        ล้าง
                      </v-btn>
                      <v-btn
                        color="primary"
                        size="small"
                        @click="endTimeMenu = false"
                      >
                        ตกลง
                      </v-btn>
                    </div>
                  </div>
                </v-card>
              </v-menu>
            </div>
          </v-col>

          <!-- Service Type Filter -->
          <!-- <v-col cols="12" md="4">
            <v-combobox
              v-model="tempSelectedServiceTypes"
              :items="serviceTypeOptions"
              label="เลือกประเภทบริการ"
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
                  :color="getServiceTypeColor(item.raw)"
                  size="small"
                  variant="tonal"
                >
                  {{ item.raw }}
                </v-chip>
              </template>
            </v-combobox>
          </v-col> -->
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

        <!-- Filter Actions -->
        <v-row class="mb-2">
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
      </v-card-text>
      <v-data-table
        :headers="salesHeaders"
        :items="filteredSalesData"
        :items-per-page="10"
        class="elevation-0"
        hover
        show-expand
        expand-on-click
      >
        <template #[`item.created_at`]="{ item }">
          <div class="text-body-2">
            {{ formatDateTime(item.created_at) }}
          </div>
        </template>
        <template #[`item.device.name`]="{ item }">
          <div class="d-flex align-center">
            <v-icon
              :color="getDeviceTypeColor(item.device.type)"
              size="small"
              class="me-2"
            >
              {{ getDeviceTypeIcon(item.device.type) }}
            </v-icon>
            <span class="text-body-2 font-weight-medium">{{
              item.device.name
            }}</span>
          </div>
        </template>
        <template #[`item.payload.status`]="{ item }">
          <v-chip
            :color="getPaymentStatusColor(item.payload.status)"
            size="small"
            variant="tonal"
          >
            {{ item.payload.status }}
          </v-chip>
        </template>
        <template #[`item.device.type`]="{ item }">
          <v-chip
            :color="getDeviceTypeColor(item.device.type)"
            size="small"
            variant="tonal"
          >
            {{ item.device.type }}
          </v-chip>
        </template>
        <template #[`item.payload.total_amount`]="{ item }">
          <div class="text-body-2 font-weight-bold text-success">
            ฿{{ item.payload.total_amount.toLocaleString("th-TH") }}
          </div>
        </template>

        <!-- Expandable row content -->
        <template #expanded-row="{ columns, item }">
          <td :colspan="columns.length" class="pa-0">
            <v-card
              class="ma-2 payment-details-card"
              color="surface-container"
              elevation="1"
              rounded="lg"
            >
              <v-card-text class="pa-4">
                <div class="payment-breakdown">
                  <!-- Header with transaction summary -->
                  <h3 class="text-subtitle-1 font-weight-bold">
                    รายละเอียดการชำระเงิน
                  </h3>

                  <!-- Payment methods grid for desktop -->
                  <v-row
                    v-if="$vuetify.display.mdAndUp"
                    no-gutters
                    class="payment-methods-grid"
                  >
                    <!-- QR Payment Section -->
                    <v-col cols="4" class="payment-section">
                      <div class="payment-method-section pa-3">
                        <div class="d-flex align-center mb-3">
                          <v-icon color="primary" size="small" class="me-2"
                            >mdi-qrcode</v-icon
                          >
                          <span class="text-subtitle-2 font-weight-medium"
                            >QR Payment</span
                          >
                        </div>

                        <div v-if="hasQrPayment(item)">
                          <v-card class="mb-2" color="primary" variant="tonal">
                            <v-card-text class="pa-3">
                              <div class="text-caption text-medium-emphasis">
                                จำนวนเงินผ่าน QR Code
                              </div>
                              <div class="text-h6 font-weight-bold">
                                ฿{{ item.payload.qr.net_amount }}
                              </div>
                            </v-card-text>
                          </v-card>
                          <v-card color="primary-lighten-1" variant="tonal">
                            <v-card-text class="pa-3">
                              <div class="text-caption text-medium-emphasis">
                                รหัสธุรกรรม
                              </div>
                              <div class="text-body-2 font-family-monospace">
                                {{ item.payload.qr.transaction_id }}
                              </div>
                            </v-card-text>
                          </v-card>
                        </div>
                        <div v-else class="text-caption text-medium-emphasis">
                          ไม่มีการชำระผ่าน QR Code
                        </div>
                      </div>
                    </v-col>

                    <!-- Bank Notes Section -->
                    <v-col cols="4" class="payment-section">
                      <div class="payment-method-section pa-3">
                        <div class="d-flex align-center mb-3">
                          <v-icon color="success" size="small" class="me-2"
                            >mdi-cash-100</v-icon
                          >
                          <span class="text-subtitle-2 font-weight-medium"
                            >ธนบัตร</span
                          >
                        </div>

                        <div v-if="hasBankNotes(item)">
                          <v-row dense>
                            <v-col
                              v-for="(count, denomination) in item.payload.bank"
                              :key="denomination"
                              cols="6"
                            >
                              <v-card
                                v-if="count > 0"
                                class="denomination-card"
                                color="success-lighten-1"
                                variant="tonal"
                              >
                                <v-card-text class="pa-2 text-center">
                                  <div class="text-body-2 font-weight-bold">
                                    ฿{{ denomination }}
                                  </div>
                                  <div class="text-caption">{{ count }} ใบ</div>
                                </v-card-text>
                              </v-card>
                            </v-col>
                          </v-row>
                        </div>
                        <div v-else class="text-caption text-medium-emphasis">
                          ไม่มีการชำระด้วยธนบัตร
                        </div>
                      </div>
                    </v-col>

                    <!-- Coins Section -->
                    <v-col cols="4" class="payment-section">
                      <div class="payment-method-section pa-3">
                        <div class="d-flex align-center mb-3">
                          <v-icon color="secondary" size="small" class="me-2"
                            >mdi-circle-multiple</v-icon
                          >
                          <span class="text-subtitle-2 font-weight-medium"
                            >เหรียญ</span
                          >
                        </div>

                        <div v-if="hasCoins(item)">
                          <v-row dense>
                            <v-col
                              v-for="(count, denomination) in item.payload.coin"
                              :key="denomination"
                              cols="6"
                            >
                              <v-card
                                v-if="count > 0"
                                class="denomination-card"
                                color="secondary-lighten-1"
                                variant="tonal"
                              >
                                <v-card-text class="pa-2 text-center">
                                  <div class="text-body-2 font-weight-bold">
                                    ฿{{ denomination }}
                                  </div>
                                  <div class="text-caption">
                                    {{ count }} เหรียญ
                                  </div>
                                </v-card-text>
                              </v-card>
                            </v-col>
                          </v-row>
                        </div>
                        <div v-else class="text-caption text-medium-emphasis">
                          ไม่มีการชำระด้วยเหรียญ
                        </div>
                      </div>
                    </v-col>
                  </v-row>

                  <!-- Mobile layout with expansion panels -->
                  <div v-else class="mobile-payment-layout">
                    <v-expansion-panels variant="accordion" multiple>
                      <v-expansion-panel
                        v-if="hasQrPayment(item)"
                        title="QR Payment"
                        expand-icon="mdi-qrcode"
                      >
                        <v-expansion-panel-text>
                          <div class="pa-2">
                            <v-card
                              class="mb-2"
                              color="primary-lighten-1"
                              variant="tonal"
                            >
                              <v-card-text class="pa-3">
                                <div class="text-caption text-medium-emphasis">
                                  Net Amount
                                </div>
                                <div class="text-h6 font-weight-bold">
                                  ฿{{ item.payload.qr.net_amount }}
                                </div>
                              </v-card-text>
                            </v-card>
                            <v-card color="primary-lighten-2" variant="tonal">
                              <v-card-text class="pa-3">
                                <div class="text-caption text-medium-emphasis">
                                  Transaction ID
                                </div>
                                <div class="text-body-2 font-family-monospace">
                                  {{ item.payload.qr.transaction_id }}
                                </div>
                              </v-card-text>
                            </v-card>
                          </div>
                        </v-expansion-panel-text>
                      </v-expansion-panel>

                      <v-expansion-panel
                        v-if="hasBankNotes(item)"
                        title="ธนบัตร"
                        expand-icon="mdi-cash-100"
                      >
                        <v-expansion-panel-text>
                          <div class="pa-2">
                            <v-row dense>
                              <v-col
                                v-for="(count, denomination) in item.payload
                                  .bank"
                                :key="denomination"
                                cols="6"
                              >
                                <v-card
                                  v-if="count > 0"
                                  class="denomination-card"
                                  color="success-lighten-1"
                                  variant="tonal"
                                >
                                  <v-card-text class="pa-2 text-center">
                                    <div class="text-body-2 font-weight-bold">
                                      ฿{{ denomination }}
                                    </div>
                                    <div class="text-caption">
                                      {{ count }} ใบ
                                    </div>
                                  </v-card-text>
                                </v-card>
                              </v-col>
                            </v-row>
                          </div>
                        </v-expansion-panel-text>
                      </v-expansion-panel>

                      <v-expansion-panel
                        v-if="hasCoins(item)"
                        title="เหรียญ"
                        expand-icon="mdi-circle-multiple"
                      >
                        <v-expansion-panel-text>
                          <div class="pa-2">
                            <v-row dense>
                              <v-col
                                v-for="(count, denomination) in item.payload
                                  .coin"
                                :key="denomination"
                                cols="6"
                              >
                                <v-card
                                  v-if="count > 0"
                                  class="denomination-card"
                                  color="secondary-lighten-1"
                                  variant="tonal"
                                >
                                  <v-card-text class="pa-2 text-center">
                                    <div class="text-body-2 font-weight-bold">
                                      ฿{{ denomination }}
                                    </div>
                                    <div class="text-caption">
                                      {{ count }} เหรียญ
                                    </div>
                                  </v-card-text>
                                </v-card>
                              </v-col>
                            </v-row>
                          </div>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </td>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
// TypeScript interfaces
interface PaymentQR {
  ref1: string | null;
  ref2: string | null;
  net_amount: number;
  transaction_id: string;
}

interface PaymentPayload {
  qr: PaymentQR;
  bank: Record<string, number>;
  coin: Record<string, number>;
  type: string;
  status: string;
  timestemp: number;
  total_amount: number;
}

interface Device {
  id: string;
  name: string;
  type: string;
  owner: {
    id: string;
    fullname: string;
    email: string;
  };
}

interface SaleItem {
  id: string;
  device_id: string;
  payload: PaymentPayload;
  created_at: string;
  device: Device;
}

const { dashboardData } = useDashboardData();
const {
  salesData: enhancedSalesData,
  loading: _salesDataLoading,
  error: _salesDataError,
  refreshData: _refreshData,
} = useEnhancedSalesData();

const datePickerMenu = ref(false);
const selectedDateObject = ref(new Date());
const selectedDate = computed(() => {
  return selectedDateObject.value.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
});

// Time picker object interface
interface TimeObject {
  hour?: number;
  hours?: number;
  minute?: number;
  minutes?: number;
}

// Filter variables
const searchQuery = ref("");
const startTimeMenu = ref(false);
const endTimeMenu = ref(false);
const startTimeObj = ref<TimeObject | Date | string | null>(null);
const endTimeObj = ref<TimeObject | Date | string | null>(null);
const selectedServiceTypes = ref<string[]>([]);

// Temporary filter variables (for pending changes)
const tempSearchQuery = ref("");
const tempStartTimeObj = ref<TimeObject | Date | string | null>(null);
const tempEndTimeObj = ref<TimeObject | Date | string | null>(null);
const tempSelectedServiceTypes = ref<string[]>([]);

// Popover filter menu state
const filterMenu = ref(false);

// Popover filter states (temporary)
const tempSelectedUserIds = ref<string[]>([]);
const tempSelectedPaymentStatuses = ref<string[]>([]);
const tempSelectedDeviceTypes = ref<string[]>([]);

// Applied popover filter states
const selectedUserIds = ref<string[]>([]);
const selectedPaymentStatuses = ref<string[]>([]);
const selectedDeviceTypes = ref<string[]>([]);

// Popover filter options
const userOptions = computed(() => {
  const users = new Set<string>();
  salesData.value.forEach((item) => {
    users.add(item.device.owner.fullname);
  });
  return Array.from(users).sort();
});

const paymentStatusOptions = ["SUCCESS", "FAILED", "PENDING"];
const deviceTypeOptions = ["WASH", "DRYING"];

// Filter count badge logic
const activeFilterCount = computed(() => {
  let count = 0;
  if (selectedUserIds.value.length > 0) count++;
  if (selectedPaymentStatuses.value.length > 0) count++;
  if (selectedDeviceTypes.value.length > 0) count++;
  return count;
});

// Helper function to format time object to HH:mm string
const formatTimeToString = (
  timeObj: TimeObject | Date | string | null
): string => {
  if (!timeObj) return "";

  // Handle different time object formats from Vuetify time picker
  if (typeof timeObj === "string") {
    return timeObj;
  }

  if (timeObj instanceof Date) {
    return timeObj.toTimeString().slice(0, 5);
  }

  // Handle Vuetify time picker object format
  if (timeObj && typeof timeObj === "object") {
    const hour = timeObj.hour || timeObj.hours || 0;
    const minute = timeObj.minute || timeObj.minutes || 0;
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  }

  return "";
};

// Main filter actions
const applyFilters = () => {
  searchQuery.value = tempSearchQuery.value;
  startTimeObj.value = tempStartTimeObj.value;
  endTimeObj.value = tempEndTimeObj.value;
  selectedServiceTypes.value = [...tempSelectedServiceTypes.value];
};

const clearAllFilters = () => {
  // Clear both temp and actual values
  tempSearchQuery.value = "";
  tempStartTimeObj.value = null;
  tempEndTimeObj.value = null;
  tempSelectedServiceTypes.value = [];

  searchQuery.value = "";
  startTimeObj.value = null;
  endTimeObj.value = null;
  selectedServiceTypes.value = [];
};

// Popover filter functions
const applyPopoverFilters = () => {
  selectedUserIds.value = [...tempSelectedUserIds.value];
  selectedPaymentStatuses.value = [...tempSelectedPaymentStatuses.value];
  selectedDeviceTypes.value = [...tempSelectedDeviceTypes.value];
  filterMenu.value = false;
};

const resetPopoverFilters = () => {
  // Clear both temp and actual values for popover filters
  tempSelectedUserIds.value = [];
  tempSelectedPaymentStatuses.value = [];
  tempSelectedDeviceTypes.value = [];

  selectedUserIds.value = [];
  selectedPaymentStatuses.value = [];
  selectedDeviceTypes.value = [];
};

// Initialize temp values on component mount
onMounted(() => {
  tempSearchQuery.value = searchQuery.value;
  tempStartTimeObj.value = startTimeObj.value;
  tempEndTimeObj.value = endTimeObj.value;
  tempSelectedServiceTypes.value = [...selectedServiceTypes.value];

  // Initialize popover filter temp values
  tempSelectedUserIds.value = [...selectedUserIds.value];
  tempSelectedPaymentStatuses.value = [...selectedPaymentStatuses.value];
  tempSelectedDeviceTypes.value = [...selectedDeviceTypes.value];
});

const kpiData = computed(() => [
  {
    title: "รายได้รายปี",
    value: dashboardData.monthRevenue.value,
    trend: dashboardData.monthRevenue.trend,
    chartData: dashboardData.monthRevenue.chartData,
    chartLabels: dashboardData.monthRevenue.chartLabels,
    chartId: "year-kpi",
    currency: true,
  },
  {
    title: "รายได้รายเดือน",
    value: dashboardData.dateRevenue.value,
    trend: dashboardData.dateRevenue.trend,
    chartData: dashboardData.dateRevenue.chartData,
    chartLabels: dashboardData.dateRevenue.chartLabels,
    chartId: "month-kpi",
    currency: true,
  },
  {
    title: "รายได้รายวัน",
    value: dashboardData.hourlyRevenue.value,
    trend: dashboardData.hourlyRevenue.trend,
    chartData: dashboardData.hourlyRevenue.chartData,
    chartLabels: dashboardData.hourlyRevenue.chartLabels,
    chartId: "date-kpi",
    currency: true,
  },
]);

const salesHeaders = [
  { title: "เวลา", key: "created_at", sortable: true },
  { title: "ชื่ออุปกรณ์", key: "device.name", sortable: true },
  { title: "สถานะ", key: "payload.status", sortable: true },
  { title: "ประเภท", key: "device.type", sortable: true },
  { title: "จำนวนเงิน", key: "payload.total_amount", sortable: true },
  { title: "", key: "data-table-expand", sortable: false },
];

// Using enhanced sales data from the composable instead of hardcoded data

// Use enhanced sales data from composable
const salesData = enhancedSalesData;

// Filtered sales data
// Check if any filter has pending changes
const hasFilterChanges = computed(() => {
  return (
    tempSearchQuery.value !== searchQuery.value ||
    JSON.stringify(tempStartTimeObj.value) !==
      JSON.stringify(startTimeObj.value) ||
    JSON.stringify(tempEndTimeObj.value) !== JSON.stringify(endTimeObj.value) ||
    JSON.stringify([...tempSelectedServiceTypes.value].sort()) !==
      JSON.stringify([...selectedServiceTypes.value].sort())
  );
});

const filteredSalesData = computed(() => {
  let filtered = salesData.value;

  // Search filter
  if (searchQuery.value && searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.device.name.toLowerCase().includes(query) ||
        item.device.type.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
    );
  }

  // Time range filter
  if (startTimeObj.value || endTimeObj.value) {
    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.created_at);
      const itemTime =
        itemDate.getHours().toString().padStart(2, "0") +
        ":" +
        itemDate.getMinutes().toString().padStart(2, "0");

      const startStr = formatTimeToString(startTimeObj.value);
      const endStr = formatTimeToString(endTimeObj.value);

      if (startStr && endStr) {
        return itemTime >= startStr && itemTime <= endStr;
      } else if (startStr) {
        return itemTime >= startStr;
      } else if (endStr) {
        return itemTime <= endStr;
      }
      return true;
    });
  }

  // Service type filter (device type)
  if (selectedServiceTypes.value.length > 0) {
    filtered = filtered.filter((item) =>
      selectedServiceTypes.value.includes(item.device.type)
    );
  }

  // Popover filters
  // User ID filter (by fullname)
  if (selectedUserIds.value.length > 0) {
    filtered = filtered.filter((item) =>
      selectedUserIds.value.includes(item.device.owner.fullname)
    );
  }

  // Payment status filter
  if (selectedPaymentStatuses.value.length > 0) {
    filtered = filtered.filter((item) =>
      selectedPaymentStatuses.value.includes(item.payload.status)
    );
  }

  // Device type filter (from popover)
  if (selectedDeviceTypes.value.length > 0) {
    filtered = filtered.filter((item) =>
      selectedDeviceTypes.value.includes(item.device.type)
    );
  }

  return filtered;
});

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(date);
};

const getDeviceTypeColor = (deviceType: string) => {
  switch (deviceType) {
    case "WASH":
      return "primary";
    case "DRYING":
      return "secondary";
    default:
      return "primary";
  }
};

const getDeviceTypeIcon = (deviceType: string) => {
  switch (deviceType) {
    case "WASH":
      return "mdi-car-wash";
    case "DRYING":
      return "mdi-air-filter";
    default:
      return "mdi-cog";
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "error";
    case "PENDING":
      return "warning";
    default:
      return "primary";
  }
};

const hasQrPayment = (item: SaleItem): boolean => {
  return (
    item.payload?.qr &&
    typeof item.payload.qr.net_amount === "number" &&
    item.payload.qr.net_amount > 0
  );
};

const hasBankNotes = (item: SaleItem): boolean => {
  return (
    item.payload?.bank &&
    Object.values(item.payload.bank).some((count: number) => count > 0)
  );
};

const hasCoins = (item: SaleItem): boolean => {
  return (
    item.payload?.coin &&
    Object.values(item.payload.coin).some((count: number) => count > 0)
  );
};
</script>

<style scoped>
.date-picker {
  min-width: 200px;
}

.chart-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(var(--v-border-color), 0.12);
  background: rgba(var(--v-theme-surface), 1);
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.15) !important;
  border-color: rgba(var(--v-border-color), 0.2);
}

.chart-wrapper {
  height: 280px;
  padding: 8px;
}

/* Typography improvements */
:deep(.v-card-title) {
  font-size: 1.125rem !important;
  font-weight: 600 !important;
  letter-spacing: -0.025em !important;
  padding: 20px 24px 8px 24px !important;
}

/* Mobile responsiveness */
@media (max-width: 960px) {
  .date-picker {
    min-width: 160px;
  }

  .chart-wrapper {
    height: 240px;
    padding: 4px;
  }

  :deep(.v-card-title) {
    font-size: 1rem !important;
    padding: 16px 20px 8px 20px !important;
  }
}

@media (max-width: 600px) {
  .chart-wrapper {
    height: 200px;
    padding: 2px;
  }

  :deep(.v-card-title) {
    font-size: 0.875rem !important;
    padding: 12px 16px 6px 16px !important;
  }
}

/* Payment details expandable row styles */
.payment-details-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(var(--v-theme-surface-container-low), 1);
}

.payment-breakdown {
  max-width: 100%;
}

.payment-methods-grid {
  gap: 0;
}

.payment-section {
  position: relative;
  min-height: 200px;
}

.payment-section:not(:last-child)::after {
  content: "";
  position: absolute;
  right: 0;
  top: 10%;
  bottom: 10%;
  width: 1px;
  background: rgba(var(--v-theme-outline), 0.2);
}

.payment-method-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.denomination-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  min-height: 50px;
}

.denomination-card:hover {
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

/* Mobile layout adjustments */
.mobile-payment-layout {
  width: 100%;
}

.mobile-payment-layout :deep(.v-expansion-panel-title) {
  padding: 12px 16px;
  font-size: 0.875rem;
  font-weight: 500;
}

.mobile-payment-layout :deep(.v-expansion-panel-text__wrapper) {
  padding: 8px 16px 16px;
}

/* Monospace font for transaction ID */
.font-family-monospace {
  font-family: "Roboto Mono", "Monaco", "Consolas", monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

/* Better responsive behavior for denomination cards */
@media (max-width: 960px) {
  .payment-section:not(:last-child)::after {
    display: none;
  }

  .payment-section {
    margin-bottom: 16px;
    min-height: auto;
  }

  .payment-section:not(:last-child) {
    border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
    padding-bottom: 16px;
  }
}

/* Enhanced visual hierarchy */
.payment-details-card :deep(.v-card-text) {
  padding: 24px !important;
}

.payment-method-section .text-subtitle-2 {
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-weight: 600;
}

.denomination-card .text-body-2 {
  color: rgba(var(--v-theme-on-surface), 0.87);
  line-height: 1.2;
}

.denomination-card .text-caption {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
}
</style>
