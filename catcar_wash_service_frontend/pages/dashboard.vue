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
            {{ salesData.length }} รายการ
          </v-chip>
        </div>
      </v-card-title>
      <v-data-table
        :headers="salesHeaders"
        :items="salesData"
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
