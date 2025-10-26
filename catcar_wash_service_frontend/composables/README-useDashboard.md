# useDashboard Composable

## Overview

A Vue composable that wraps the `DashboardApiService` for fetching and managing dashboard KPI (Key Performance Indicator) data. This composable provides a reactive interface for retrieving revenue metrics across different time periods (monthly, daily, hourly) with automatic data transformation for chart visualization.

## Purpose

- Fetch dashboard summary data (monthly, daily, hourly revenue)
- Transform API response data for KPI cards and charts
- Handle date filtering and other dashboard filters
- Manage loading and error states
- Provide Thai-localized month labels for charts
- Default to today's date on initialization

## Usage

### Basic Usage

```typescript
<script setup lang="ts">
import { useDashboard } from '~/composables/useDashboard'

const {
  monthlyData,
  dailyData,
  hourlyData,
  isLoading,
  error,
  fetchDashboardSummary,
  updateFilter,
  clearMessages
} = useDashboard()

// Fetch on mount with default filter (today's date)
onMounted(async () => {
  await fetchDashboardSummary()
})
</script>
```

### With Date Filter

```typescript
// Update dashboard data for specific date
await updateFilter({
  date: '2025-01-15'
})
```

### With Multiple Filters

```typescript
import type { EnumDeviceType, EnumPaymentStatus } from '~/types'

await updateFilter({
  date: '2025-01-15',
  device_type: 'WASH' as EnumDeviceType,
  payment_status: 'SUCCEEDED' as EnumPaymentStatus
})
```

### Custom Filter on Fetch

```typescript
// Override default filter
await fetchDashboardSummary({
  date: '2025-01-15',
  user_id: 'user-123',
  include_charts: true
})
```

## API Reference

### State

| Property | Type | Description |
|----------|------|-------------|
| `dashboardSummary` | `DashboardSummaryResponse \| null` | Raw API response containing monthly, daily, and hourly data |
| `currentFilter` | `DashboardFilterRequest` | Current filter parameters (defaults to today's date + charts enabled) |
| `isLoading` | `boolean` | Loading state during API calls |
| `error` | `string \| null` | Error message (Thai language) |
| `successMessage` | `string \| null` | Success message (Thai: "ดึงข้อมูลแดชบอร์ดสำเร็จ") |

**Note**: All state properties are exposed as `readonly` refs for safety.

### Computed Properties

#### `monthlyData`

Transformed monthly revenue data with Thai month abbreviations.

**Returns**:
```typescript
{
  value: number,        // Total monthly revenue
  trend: number,        // Percentage change from previous period
  chartData: number[],  // Array of amounts for each month
  chartLabels: string[] // Thai month labels ["ม.ค.", "ก.พ.", "มี.ค.", ...]
} | null
```

#### `dailyData`

Transformed daily revenue data with day numbers.

**Returns**:
```typescript
{
  value: number,        // Total daily revenue
  trend: number,        // Percentage change from previous period
  chartData: number[],  // Array of amounts for each day
  chartLabels: string[] // Day numbers ["1", "2", "3", ..., "31"]
} | null
```

#### `hourlyData`

Transformed hourly revenue data with time labels.

**Returns**:
```typescript
{
  value: number,        // Total hourly revenue
  trend: number,        // Percentage change from previous period
  chartData: number[],  // Array of amounts for each hour
  chartLabels: string[] // Time labels ["00:00", "01:00", ..., "23:00"]
} | null
```

All computed properties return `null` if no data is available.

### Methods

#### `fetchDashboardSummary(filter?: DashboardFilterRequest)`

Fetches dashboard summary data from the API.

- **Parameters**:
  - `filter` (optional): Filter parameters to override current filter
- **Returns**: `Promise<void>`
- **Side Effects**:
  - Sets `isLoading` to `true` during fetch
  - Updates `dashboardSummary` on success
  - Sets `successMessage` to "ดึงข้อมูลแดชบอร์ดสำเร็จ" on success
  - Sets `error` to "ไม่สามารถดึงข้อมูลแดชบอร์ดได้" on failure
  - Clears previous messages before fetch

**Example**:
```typescript
// Use current filter
await fetchDashboardSummary()

// Override with specific filter
await fetchDashboardSummary({
  date: '2025-01-15',
  device_type: 'WASH'
})
```

#### `updateFilter(filter: Partial<DashboardFilterRequest>)`

Updates the current filter and refetches dashboard data.

- **Parameters**:
  - `filter`: Partial filter object to merge with current filter
- **Returns**: `Promise<void>`
- **Behavior**: Merges provided filter with existing `currentFilter`, then calls `fetchDashboardSummary()`

**Example**:
```typescript
// Update only the date
await updateFilter({ date: '2025-02-01' })

// Update multiple filter properties
await updateFilter({
  date: '2025-02-01',
  device_type: 'DRYING',
  include_charts: false
})
```

#### `clearMessages()`

Clears error and success messages.

- **Parameters**: None
- **Returns**: `void`
- **Side Effects**: Sets both `error` and `successMessage` to `null`

#### `resetState()`

Resets all state to initial values.

- **Parameters**: None
- **Returns**: `void`
- **Side Effects**:
  - Sets `dashboardSummary` to `null`
  - Resets `currentFilter` to `{ date: getTodayDate(), include_charts: true }`
  - Calls `clearMessages()`

## Filter Options

```typescript
interface DashboardFilterRequest {
  user_id?: string              // Filter by specific user
  device_id?: string            // Filter by specific device
  device_type?: EnumDeviceType  // 'WASH' | 'DRYING'
  payment_status?: EnumPaymentStatus  // Payment status filter
  date: string                  // YYYY-MM-DD format (required in practice)
  include_charts?: boolean      // Include chart data in response
}
```

**Default Filter**:
```typescript
{
  date: getTodayDate(),  // Today's date in YYYY-MM-DD
  include_charts: true   // Always fetch chart data
}
```

## Data Transformation

### Monthly Data Labels

Thai month abbreviations are generated from month numbers:

```typescript
const thaiMonths = [
  "ม.ค.",  // มกราคม (January)
  "ก.พ.",  // กุมภาพันธ์ (February)
  "มี.ค.", // มีนาคม (March)
  "เม.ย.", // เมษายน (April)
  "พ.ค.",  // พฤษภาคม (May)
  "มิ.ย.", // มิถุนายน (June)
  "ก.ค.",  // กรกฎาคม (July)
  "ส.ค.",  // สิงหาคม (August)
  "ก.ย.",  // กันยายน (September)
  "ต.ค.",  // ตุลาคม (October)
  "พ.ย.",  // พฤศจิกายน (November)
  "ธ.ค."   // ธันวาคม (December)
]
```

### Daily Data Labels

Day numbers as strings: `["1", "2", "3", ..., "31"]`

### Hourly Data Labels

24-hour time format with zero-padding: `["00:00", "01:00", "02:00", ..., "23:00"]`

## Example: Dashboard Page Integration

### Complete Integration Example

```typescript
<script setup lang="ts">
import { useDashboard } from '~/composables/useDashboard'

const {
  monthlyData,
  dailyData,
  hourlyData,
  isLoading,
  error,
  fetchDashboardSummary,
  updateFilter,
  clearMessages
} = useDashboard()

// Date picker state
const selectedDateObject = ref<Date>(new Date())

// Format date helper
const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Watch date changes and update filter
watch(selectedDateObject, (newDate) => {
  if (newDate) {
    const dateStr = formatDate(newDate)
    updateFilter({ date: dateStr })
  }
})

// KPI cards data
const kpiData = computed(() => [
  {
    title: "รายได้รายเดือน",
    subtitle: "เดือนนี้",
    value: monthlyData.value?.value || 0,
    trend: monthlyData.value?.trend || 0,
    chartData: monthlyData.value?.chartData || [],
    chartLabels: monthlyData.value?.chartLabels || [],
    color: "primary"
  },
  {
    title: "รายได้รายวัน",
    subtitle: "วันนี้",
    value: dailyData.value?.value || 0,
    trend: dailyData.value?.trend || 0,
    chartData: dailyData.value?.chartData || [],
    chartLabels: dailyData.value?.chartLabels || [],
    color: "secondary"
  },
  {
    title: "รายได้รายชั่วโมง",
    subtitle: "ชั่วโมงนี้",
    value: hourlyData.value?.value || 0,
    trend: hourlyData.value?.trend || 0,
    chartData: hourlyData.value?.chartData || [],
    chartLabels: hourlyData.value?.chartLabels || [],
    color: "tertiary"
  }
])

// Fetch on mount
onMounted(async () => {
  await fetchDashboardSummary()
})

// Clear error on unmount
onUnmounted(() => {
  clearMessages()
})
</script>

<template>
  <VContainer class="pa-6">
    <!-- Header with date picker -->
    <VRow class="mb-8">
      <VCol cols="12" md="6">
        <h1 class="text-h4 font-weight-bold">แดชบอร์ด</h1>
      </VCol>
      <VCol cols="12" md="6" class="d-flex justify-end align-center">
        <VDatePicker
          v-model="selectedDateObject"
          :disabled="isLoading"
          hide-details
        />
      </VCol>
    </VRow>

    <!-- Error Alert -->
    <VAlert
      v-if="error"
      type="error"
      class="mb-6"
      closable
      @click:close="clearMessages"
    >
      {{ error }}
    </VAlert>

    <!-- Loading State -->
    <VProgressLinear
      v-if="isLoading"
      indeterminate
      color="primary"
      class="mb-6"
    />

    <!-- KPI Cards -->
    <VRow class="mb-8">
      <VCol
        v-for="(kpi, index) in kpiData"
        :key="index"
        cols="12"
        md="4"
      >
        <DashboardKpiCard
          :title="kpi.title"
          :subtitle="kpi.subtitle"
          :value="kpi.value"
          :trend="kpi.trend"
          :chart-data="kpi.chartData"
          :chart-labels="kpi.chartLabels"
          :color="kpi.color"
        />
      </VCol>
    </VRow>
  </VContainer>
</template>
```

### Filter with Device Type

```typescript
<script setup lang="ts">
const { updateFilter } = useDashboard()

const deviceType = ref<EnumDeviceType>()
const selectedDate = ref('2025-01-15')

const applyFilters = async () => {
  await updateFilter({
    date: selectedDate.value,
    device_type: deviceType.value,
    include_charts: true
  })
}
</script>

<template>
  <VSelect
    v-model="deviceType"
    :items="[
      { title: 'ทั้งหมด', value: undefined },
      { title: 'เครื่องล้าง', value: 'WASH' },
      { title: 'เครื่องเป่า', value: 'DRYING' }
    ]"
    label="ประเภทเครื่อง"
    @update:model-value="applyFilters"
  />
</template>
```

## Error Handling

All errors are caught internally and displayed in Thai language:

- **Fetch error**: "ไม่สามารถดึงข้อมูลแดชบอร์ดได้"
- **Success message**: "ดึงข้อมูลแดชบอร์ดสำเร็จ"

Errors are exposed via the `error` ref and can be displayed using Vuetify's `VAlert`:

```typescript
<VAlert
  v-if="error"
  type="error"
  closable
  @click:close="clearMessages"
>
  {{ error }}
</VAlert>
```

## Type Safety

This composable is fully typed with TypeScript. **No `any` types are used**.

### Key Interfaces

```typescript
// From dashboard-api.service.ts
interface DashboardSummaryResponse {
  monthly: RevenueData
  daily: RevenueData
  hourly: RevenueData
}

interface RevenueData {
  revenue: number
  change: number
  data?: Array<{
    month?: string
    day?: string
    hour?: string
    amount: number
  }>
}

interface DashboardFilterRequest {
  user_id?: string
  device_id?: string
  device_type?: EnumDeviceType
  payment_status?: EnumPaymentStatus
  date: string
  include_charts?: boolean
}
```

## Helper Functions

### `getThaiMonthLabel(month: string): string`

Converts month number (01-12) to Thai abbreviation.

```typescript
getThaiMonthLabel("01") // Returns "ม.ค."
getThaiMonthLabel("12") // Returns "ธ.ค."
```

### `getHourLabel(hour: string): string`

Converts hour (0-23) to formatted time label.

```typescript
getHourLabel("0")  // Returns "00:00"
getHourLabel("15") // Returns "15:00"
```

### `getTodayDate(): string`

Returns today's date in YYYY-MM-DD format.

```typescript
getTodayDate() // Returns "2025-10-25" (example)
```

## State Management

This composable creates **local state** (not global). Each component that calls `useDashboard()` gets its own isolated state instance. This is intentional for component-level data management.

If you need global state, consider using Pinia stores instead.

## Performance Considerations

- Chart data is only fetched when `include_charts: true` (default)
- Set `include_charts: false` if you only need summary values
- All computed properties use memoization (Vue's built-in computed caching)
- API calls are debounced through user interaction (not automatic)

## Related Files

- **API Service**: `/catcar_wash_service_frontend/services/apis/dashboard-api.service.ts`
- **Usage Example**: `/catcar_wash_service_frontend/pages/dashboard.vue`
- **Type Definitions**: `/catcar_wash_service_frontend/types/index.ts`

## Version History

- **Initial Version**: Created with TypeScript, Composition API, and Thai localization
- Follows Nuxt 3 best practices and Vue 3 Composition API patterns
