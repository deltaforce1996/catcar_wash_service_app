<template>
  <div class="dashboard-container">
    <!-- Header Section -->
    <v-row class="mb-8">
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
            <v-btn
              variant="outlined"
              prepend-icon="mdi-filter-variant"
              class="text-none"
            >
              กรองข้อมูล
            </v-btn>
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
      <v-card-text class="pb-0">
        <v-row class="mb-4">
          <!-- Search Bar -->
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              placeholder="ค้นหาด้วยชื่อบริการ หรือรหัสเครื่อง"
              hide-details
              clearable
            />
          </v-col>

          <!-- Time Range Picker -->
          <v-col cols="12" md="4">
            <div class="d-flex ga-2">
              <!-- Start Time Field -->
              <v-menu v-model="startTimeMenu" :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="formatTimeToString(startTimeObj)"
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
                      v-model="startTimeObj"
                      scrollable
                      :max="
                        endTimeObj ? formatTimeToString(endTimeObj) : undefined
                      "
                      class="time-picker-compact"
                    />
                    <div class="d-flex justify-end ga-2">
                      <v-btn
                        variant="text"
                        size="small"
                        @click="startTimeObj = null"
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
                    :model-value="formatTimeToString(endTimeObj)"
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
                      v-model="endTimeObj"
                      scrollable
                      :min="
                        startTimeObj
                          ? formatTimeToString(startTimeObj)
                          : undefined
                      "
                      class="time-picker-compact"
                    />
                    <div class="d-flex justify-end ga-2">
                      <v-btn
                        variant="text"
                        size="small"
                        @click="endTimeObj = null"
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
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedServiceTypes"
              :items="serviceTypeOptions"
              variant="outlined"
              density="compact"
              placeholder="เลือกประเภทบริการ"
              prepend-inner-icon="mdi-filter-variant"
              multiple
              chips
              closable-chips
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-data-table
        :headers="salesHeaders"
        :items="filteredSalesData"
        :items-per-page="10"
        class="elevation-0"
        hover
      >
        <template #[`item.timestamp`]="{ item }">
          <div class="text-body-2">
            {{ formatDateTime(item.timestamp) }}
          </div>
        </template>
        <template #[`item.deviceId`]="{ item }">
          <div class="text-body-2 font-weight-medium">
            {{ item.deviceId }}
          </div>
        </template>
        <template #[`item.moneyReceived`]="{ item }">
          <div class="text-body-2 font-weight-medium text-success">
            ฿{{ item.moneyReceived.toLocaleString("th-TH") }}
          </div>
        </template>
        <template #[`item.serviceType`]="{ item }">
          <v-chip
            :color="getServiceTypeColor(item.serviceType)"
            size="small"
            variant="tonal"
          >
            {{ item.serviceType }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
const { dashboardData } = useDashboardData();

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

// Service type options
const serviceTypeOptions = ["เบสิก", "ดีลักซ์", "พรีเมียม", "จักรยานยนต์"];

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

const kpiData = computed(() => [
  // {
  //   title: 'รายได้รายปี',
  //   value: dashboardData.yearRevenue.value,
  //   trend: dashboardData.yearRevenue.trend,
  //   chartData: dashboardData.yearRevenue.chartData,
  //   chartLabels: dashboardData.yearRevenue.chartLabels,
  //   chartId: 'year-kpi',
  //   currency: true
  // },
  // {
  //   title: 'รายได้รายเดือน',
  //   value: dashboardData.monthRevenue.value,
  //   trend: dashboardData.monthRevenue.trend,
  //   chartData: dashboardData.monthRevenue.chartData,
  //   chartLabels: dashboardData.monthRevenue.chartLabels,
  //   chartId: 'month-kpi',
  //   currency: true
  // },
  // {
  //   title: 'รายได้รายวัน',
  //   value: dashboardData.dateRevenue.value,
  //   trend: dashboardData.dateRevenue.trend,
  //   chartData: dashboardData.dateRevenue.chartData,
  //   chartLabels: dashboardData.dateRevenue.chartLabels,
  //   chartId: 'date-kpi',
  //   currency: true
  // }
  {
    title: "รายได้รายปี",
    value: dashboardData.monthRevenue.value,
    trend: dashboardData.monthRevenue.trend,
    chartData: dashboardData.monthRevenue.chartData,
    chartLabels: dashboardData.monthRevenue.chartLabels,
    chartId: "month-kpi",
    currency: true,
  },
  {
    title: "รายได้รายเดือน",
    value: dashboardData.dateRevenue.value,
    trend: dashboardData.dateRevenue.trend,
    chartData: dashboardData.dateRevenue.chartData,
    chartLabels: dashboardData.dateRevenue.chartLabels,
    chartId: "date-kpi",
    currency: true,
  },
  {
    title: "รายได้รายวัน",
    value: dashboardData.hourlyRevenue.value,
    trend: dashboardData.hourlyRevenue.trend,
    chartData: dashboardData.hourlyRevenue.chartData,
    chartLabels: dashboardData.hourlyRevenue.chartLabels,
    chartId: "hourly-kpi",
    currency: true,
  },
]);

const salesHeaders = [
  { title: "เวลา", key: "timestamp", sortable: true },
  { title: "รหัสเครื่อง", key: "deviceId", sortable: true },
  { title: "ชื่อบริการ", key: "serviceName", sortable: true },
  { title: "ประเภทบริการ", key: "serviceType", sortable: true },
  { title: "จำนวนเงิน", key: "moneyReceived", sortable: true },
];

const { salesData } = useSalesData();

// Filtered sales data
const filteredSalesData = computed(() => {
  let filtered = salesData.value;

  // Search filter
  if (searchQuery.value && searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.serviceName.toLowerCase().includes(query) ||
        item.deviceId.toLowerCase().includes(query)
    );
  }

  // Time range filter
  if (startTimeObj.value || endTimeObj.value) {
    filtered = filtered.filter((item) => {
      const itemTime =
        item.timestamp.getHours().toString().padStart(2, "0") +
        ":" +
        item.timestamp.getMinutes().toString().padStart(2, "0");

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

  // Service type filter
  if (selectedServiceTypes.value.length > 0) {
    filtered = filtered.filter((item) =>
      selectedServiceTypes.value.includes(item.serviceType)
    );
  }

  return filtered;
});

const formatDateTime = (date: Date) => {
  return date.toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getServiceTypeColor = (serviceType: string) => {
  switch (serviceType) {
    case "เบสิก":
      return "primary";
    case "ดีลักซ์":
      return "secondary";
    case "พรีเมียม":
      return "success";
    case "จักรยานยนต์":
      return "info";
    default:
      return "primary";
  }
};
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

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

/* Time picker styling */
.time-picker-compact :deep(.v-time-picker) {
  max-width: 280px;
}

.time-picker-compact :deep(.v-time-picker__controls) {
  padding: 8px !important;
}

.time-picker-compact :deep(.v-time-picker__clock) {
  margin: 8px !important;
}

/* Mobile responsiveness */
@media (max-width: 960px) {
  .dashboard-container {
    padding: 0 16px;
  }

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

  .time-picker-compact :deep(.v-time-picker) {
    max-width: 240px;
  }
}

@media (max-width: 600px) {
  .dashboard-container {
    padding: 0 12px;
  }

  .chart-wrapper {
    height: 200px;
    padding: 2px;
  }

  :deep(.v-card-title) {
    font-size: 0.875rem !important;
    padding: 12px 16px 6px 16px !important;
  }
}
</style>
