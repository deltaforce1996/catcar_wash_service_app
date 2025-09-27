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

    <!-- Sales Detail Table -->
    <BaseDataTableOptimized
      title="รายละเอียดการขาย"
      :headers="salesHeaders"
      :items="filteredSalesData"
      :filter-manager="salesFilterManager"
      :loading="isLoading"
      virtual-scrolling
      :height="600"
      show-expand
      expand-on-click
      @apply-filters="handleApplyFilters"
      @clear-filters="handleClearFilters"
      @click:row="handleRowClick"
    >
      <!-- Enhanced Filters Section -->
      <template #filters="{ filterManager }">
        <v-row>
          <!-- Enhanced Search Bar -->
          <v-col cols="12" md="4">
            <SearchFilter
              v-model="searchQuery"
              placeholder="ค้นหาด้วยชื่อบริการ หรือรหัสเครื่อง"
              aria-label="ค้นหาการขาย"
              :debounce="400"
              :min-length="2"
              show-search-indicator
              search-indicator-color="primary"
              @clear="handleSearchClear"
              @focus="trackSearchFocus"
            />
          </v-col>

          <!-- Time Range Filter -->
          <v-col cols="12" md="4">
            <TimeRangeFilter
              v-model:start-time="timeRange.start"
              v-model:end-time="timeRange.end"
              @update="handleTimeRangeUpdate"
            />
          </v-col>

          <!-- Advanced Filters Popover -->
          <v-col cols="12" md="4">
            <AdvancedFiltersPopover
              v-model:user-ids="selectedUserIds"
              v-model:payment-statuses="selectedPaymentStatuses"
              v-model:device-types="selectedDeviceTypes"
              :user-options="userOptions"
              :payment-status-options="paymentStatusOptions"
              :device-type-options="deviceTypeOptions"
              :active-count="activeAdvancedFilterCount"
              @apply="handleAdvancedFiltersApply"
              @clear="handleAdvancedFiltersClear"
            />
          </v-col>
        </v-row>
      </template>

      <!-- Enhanced Column Templates -->
      <template #[`item.created_at`]="{ item, value }">
        <div class="text-body-2">
          <v-tooltip :text="formatDateTime(value)" location="top">
            <template #activator="{ props }">
              <span v-bind="props">{{ formatRelativeTime(value) }}</span>
            </template>
          </v-tooltip>
        </div>
      </template>

      <template #[`item.device.name`]="{ item }">
        <div class="d-flex align-center">
          <v-avatar
            :color="getDeviceTypeColor(item.device.type)"
            size="24"
            class="me-2"
          >
            <v-icon
              :icon="getDeviceTypeIcon(item.device.type)"
              size="14"
              color="white"
            />
          </v-avatar>
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ item.device.name }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ item.device.id.slice(-8) }}
            </div>
          </div>
        </div>
      </template>

      <template #[`item.payload.status`]="{ item }">
        <StatusChip
          :status="item.payload.status"
          :color="getPaymentStatusColor(item.payload.status)"
          show-icon
        />
      </template>

      <template #[`item.device.type`]="{ item }">
        <v-chip
          :color="getDeviceTypeColor(item.device.type)"
          size="small"
          variant="tonal"
          class="text-caption"
        >
          <v-icon start size="small">
            {{ getDeviceTypeIcon(item.device.type) }}
          </v-icon>
          {{ getDeviceTypeLabel(item.device.type) }}
        </v-chip>
      </template>

      <template #[`item.payload.total_amount`]="{ item, value }">
        <div class="text-body-2 font-weight-bold text-success">
          <AnimatedNumber
            :value="value"
            currency="THB"
            :duration="300"
          />
        </div>
      </template>

      <!-- Enhanced Expandable Row Content -->
      <template #expanded-row="{ item, index }">
        <PaymentDetailsCard
          :item="item"
          :index="index"
          :expanded="true"
          @close="handleExpandClose(item)"
        />
      </template>

      <!-- Custom Loading State -->
      <template #loading>
        <div class="d-flex flex-column align-center justify-center py-8">
          <v-progress-circular
            indeterminate
            color="primary"
            size="48"
            class="mb-4"
          />
          <div class="text-body-2 text-medium-emphasis">
            กำลังโหลดข้อมูลการขาย...
          </div>
        </div>
      </template>

      <!-- Custom No Data State -->
      <template #no-data>
        <div class="d-flex flex-column align-center justify-center py-12">
          <v-icon
            icon="mdi-database-off-outline"
            size="64"
            color="medium-emphasis"
            class="mb-4"
          />
          <div class="text-h6 font-weight-medium mb-2">
            ไม่พบข้อมูลการขาย
          </div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            ลองปรับเปลี่ยนตัวกรองหรือช่วงเวลาที่เลือก
          </div>
          <v-btn
            variant="outlined"
            prepend-icon="mdi-refresh"
            @click="handleRefreshData"
          >
            รีเฟรชข้อมูล
          </v-btn>
        </div>
      </template>

      <!-- Custom Filter Actions -->
      <template #title-actions>
        <v-btn-group variant="outlined" density="compact">
          <v-btn
            :color="viewMode === 'table' ? 'primary' : 'default'"
            icon="mdi-table"
            @click="viewMode = 'table'"
          />
          <v-btn
            :color="viewMode === 'cards' ? 'primary' : 'default'"
            icon="mdi-view-grid"
            @click="viewMode = 'cards'"
          />
        </v-btn-group>
      </template>
    </BaseDataTableOptimized>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, shallowRef } from 'vue'
import type { DataTableHeader, DataTableItem } from '~/types/data-table'
import { useFilterManager, useTimeRangeFilter } from '~/composables/useFilterManager'

// =============================================================================
// COMPONENT IMPORTS
// =============================================================================

import BaseDataTableOptimized from '~/components/common/BaseDataTableOptimized.vue'
import SearchFilter from '~/components/common/SearchFilter.vue'
import TimeRangeFilter from '~/components/filters/TimeRangeFilter.vue'
import AdvancedFiltersPopover from '~/components/filters/AdvancedFiltersPopover.vue'
import StatusChip from '~/components/common/StatusChip.vue'
import AnimatedNumber from '~/components/common/AnimatedNumber.vue'
import PaymentDetailsCard from '~/components/dashboard/PaymentDetailsCard.vue'
import KPICard from '~/components/dashboard/KPICard.vue'

// =============================================================================
// TYPES
// =============================================================================

interface SaleItem extends DataTableItem {
  id: string
  device_id: string
  payload: {
    qr: {
      ref1: string | null
      ref2: string | null
      net_amount: number
      transaction_id: string
    }
    bank: Record<string, number>
    coin: Record<string, number>
    type: string
    status: 'SUCCESS' | 'FAILED' | 'PENDING'
    timestemp: number
    total_amount: number
  }
  created_at: string
  device: {
    id: string
    name: string
    type: 'WASH' | 'DRYING'
    owner: {
      id: string
      fullname: string
      email: string
    }
  }
}

// =============================================================================
// COMPOSABLES
// =============================================================================

const { dashboardData } = useDashboardData()
const {
  salesData: enhancedSalesData,
  loading: salesDataLoading,
  error: salesDataError,
  refreshData: refreshSalesData,
} = useEnhancedSalesData()

// Enhanced filter management with type safety
const salesFilterManager = useFilterManager<{
  search: string
  userIds: string[]
  paymentStatuses: string[]
  deviceTypes: string[]
  dateRange: [string, string] | null
}>()

// Time range filter with specialized composable
const {
  startTime,
  endTime,
  tempStartTime,
  tempEndTime,
  hasTimeRange,
  hasTimeChanges,
  formatTimeToString,
  applyTimeRange,
  clearTimeRange,
  resetTempTimeRange,
  filterByTimeRange
} = useTimeRangeFilter()

// =============================================================================
// REACTIVE STATE
// =============================================================================

const datePickerMenu = ref(false)
const selectedDateObject = ref(new Date())
const viewMode = ref<'table' | 'cards'>('table')
const isLoading = ref(false)

// Search functionality
const searchQuery = ref('')

// Time range state
const timeRange = ref({
  start: null as string | null,
  end: null as string | null
})

// Advanced filter state
const selectedUserIds = ref<string[]>([])
const selectedPaymentStatuses = ref<string[]>([])
const selectedDeviceTypes = ref<string[]>([])

// Performance monitoring
const filterPerformance = shallowRef({
  lastFilterTime: 0,
  averageFilterTime: 0,
  filterCount: 0
})

// =============================================================================
// COMPUTED PROPERTIES
// =============================================================================

const selectedDate = computed(() => {
  return selectedDateObject.value.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
})

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
])

const salesHeaders: DataTableHeader[] = [
  {
    title: "เวลา",
    key: "created_at",
    sortable: true,
    width: 180,
    class: "text-no-wrap"
  },
  {
    title: "อุปกรณ์",
    key: "device.name",
    sortable: true,
    width: 250
  },
  {
    title: "สถานะ",
    key: "payload.status",
    sortable: true,
    align: "center",
    width: 120
  },
  {
    title: "ประเภท",
    key: "device.type",
    sortable: true,
    align: "center",
    width: 140
  },
  {
    title: "จำนวนเงิน",
    key: "payload.total_amount",
    sortable: true,
    align: "end",
    width: 150,
    class: "font-weight-bold"
  },
  {
    title: "",
    key: "data-table-expand",
    sortable: false,
    width: 48,
    align: "center"
  },
]

// Enhanced filtering with performance monitoring
const filteredSalesData = computed(() => {
  const start = performance.now()

  let filtered = enhancedSalesData.value

  // Search filter
  if (searchQuery.value && searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (item: SaleItem) =>
        item.device.name.toLowerCase().includes(query) ||
        item.device.type.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.device.owner.fullname.toLowerCase().includes(query)
    )
  }

  // Time range filter
  if (hasTimeRange.value) {
    filtered = filterByTimeRange(filtered)
  }

  // Advanced filters
  if (selectedUserIds.value.length > 0) {
    filtered = filtered.filter((item: SaleItem) =>
      selectedUserIds.value.includes(item.device.owner.fullname)
    )
  }

  if (selectedPaymentStatuses.value.length > 0) {
    filtered = filtered.filter((item: SaleItem) =>
      selectedPaymentStatuses.value.includes(item.payload.status)
    )
  }

  if (selectedDeviceTypes.value.length > 0) {
    filtered = filtered.filter((item: SaleItem) =>
      selectedDeviceTypes.value.includes(item.device.type)
    )
  }

  // Performance monitoring
  const duration = performance.now() - start
  filterPerformance.value.lastFilterTime = duration
  filterPerformance.value.filterCount++
  filterPerformance.value.averageFilterTime =
    (filterPerformance.value.averageFilterTime + duration) / 2

  return filtered
})

// Filter options
const userOptions = computed(() => {
  const users = new Set<string>()
  enhancedSalesData.value.forEach((item: SaleItem) => {
    users.add(item.device.owner.fullname)
  })
  return Array.from(users).sort()
})

const paymentStatusOptions = ['SUCCESS', 'FAILED', 'PENDING']
const deviceTypeOptions = ['WASH', 'DRYING']

const activeAdvancedFilterCount = computed(() => {
  let count = 0
  if (selectedUserIds.value.length > 0) count++
  if (selectedPaymentStatuses.value.length > 0) count++
  if (selectedDeviceTypes.value.length > 0) count++
  return count
})

// =============================================================================
// METHODS
// =============================================================================

// Enhanced event handlers
const handleApplyFilters = (): void => {
  applyTimeRange()
  // Additional filter application logic
  trackFilterApplication('manual_apply')
}

const handleClearFilters = (): void => {
  searchQuery.value = ''
  clearTimeRange()
  selectedUserIds.value = []
  selectedPaymentStatuses.value = []
  selectedDeviceTypes.value = []
  trackFilterApplication('clear_all')
}

const handleSearchClear = (): void => {
  searchQuery.value = ''
  trackFilterApplication('search_clear')
}

const handleTimeRangeUpdate = (range: { start: string | null; end: string | null }): void => {
  timeRange.value = range
  trackFilterApplication('time_range_update')
}

const handleAdvancedFiltersApply = (): void => {
  // Logic handled by v-model bindings
  trackFilterApplication('advanced_apply')
}

const handleAdvancedFiltersClear = (): void => {
  selectedUserIds.value = []
  selectedPaymentStatuses.value = []
  selectedDeviceTypes.value = []
  trackFilterApplication('advanced_clear')
}

const handleRowClick = (event: Event, { item }: { item: SaleItem }): void => {
  console.log('Row clicked:', item)
  trackUserInteraction('row_click', { itemId: item.id })
}

const handleExpandClose = (item: SaleItem): void => {
  // Logic to close expanded row
  trackUserInteraction('expand_close', { itemId: item.id })
}

const handleRefreshData = async (): void => {
  isLoading.value = true
  try {
    await refreshSalesData()
    trackUserInteraction('data_refresh')
  } finally {
    isLoading.value = false
  }
}

// Utility methods
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(date)
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'เมื่อสักครู่'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`

  return formatDateTime(dateString)
}

const getDeviceTypeColor = (deviceType: string) => {
  switch (deviceType) {
    case "WASH": return "primary"
    case "DRYING": return "secondary"
    default: return "primary"
  }
}

const getDeviceTypeIcon = (deviceType: string) => {
  switch (deviceType) {
    case "WASH": return "mdi-car-wash"
    case "DRYING": return "mdi-air-filter"
    default: return "mdi-cog"
  }
}

const getDeviceTypeLabel = (deviceType: string) => {
  switch (deviceType) {
    case "WASH": return "ล้างรถ"
    case "DRYING": return "เป่าลม"
    default: return deviceType
  }
}

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "SUCCESS": return "success"
    case "FAILED": return "error"
    case "PENDING": return "warning"
    default: return "primary"
  }
}

// Analytics and tracking
const trackFilterApplication = (type: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Filter applied: ${type}`, {
      searchQuery: searchQuery.value,
      timeRange: timeRange.value,
      advancedFilters: {
        userIds: selectedUserIds.value.length,
        paymentStatuses: selectedPaymentStatuses.value.length,
        deviceTypes: selectedDeviceTypes.value.length
      },
      performance: filterPerformance.value
    })
  }
}

const trackUserInteraction = (action: string, data?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`User interaction: ${action}`, data)
  }
}

const trackSearchFocus = (): void => {
  trackUserInteraction('search_focus')
}

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(() => {
  // Initialize filter manager
  salesFilterManager.registerField('search', {
    type: 'text',
    placeholder: 'ค้นหา...',
    defaultValue: '',
    immediate: false
  })

  salesFilterManager.registerField('userIds', {
    type: 'multiselect',
    label: 'ผู้ใช้',
    options: userOptions.value,
    defaultValue: []
  })

  salesFilterManager.registerField('paymentStatuses', {
    type: 'multiselect',
    label: 'สถานะการชำระ',
    options: paymentStatusOptions,
    defaultValue: []
  })

  salesFilterManager.registerField('deviceTypes', {
    type: 'multiselect',
    label: 'ประเภทอุปกรณ์',
    options: deviceTypeOptions,
    defaultValue: []
  })

  trackUserInteraction('dashboard_mounted')
})

// =============================================================================
// WATCHERS
// =============================================================================

// Performance monitoring
watch(
  () => filterPerformance.value,
  (newPerf) => {
    if (newPerf.lastFilterTime > 100) {
      console.warn('Slow filter operation detected:', newPerf.lastFilterTime, 'ms')
    }
  },
  { deep: true }
)

// Auto-save filter preferences
watch(
  [searchQuery, selectedUserIds, selectedPaymentStatuses, selectedDeviceTypes],
  () => {
    // Save to localStorage for persistence
    localStorage.setItem('dashboard-filters', JSON.stringify({
      searchQuery: searchQuery.value,
      userIds: selectedUserIds.value,
      paymentStatuses: selectedPaymentStatuses.value,
      deviceTypes: selectedDeviceTypes.value
    }))
  },
  { deep: true }
)
</script>

<style scoped>
.date-picker {
  min-width: 200px;
}

/* Enhanced performance styles */
.optimized-table {
  contain: layout style paint;
}

.virtualized-row {
  height: 56px;
  display: flex;
  align-items: center;
}

/* Filter performance indicator */
.filter-performance {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  background: rgba(var(--v-theme-surface), 0.9);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

/* Mobile responsiveness */
@media (max-width: 960px) {
  .date-picker {
    min-width: 160px;
  }
}

@media (max-width: 600px) {
  .filter-performance {
    display: none;
  }
}

/* Development-only styles */
.development-mode {
  border-left: 4px solid orange;
  padding-left: 16px;
}
</style>