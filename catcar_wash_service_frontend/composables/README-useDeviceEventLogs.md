# useDeviceEventLogs Composable

## Overview

A Vue composable that manages device event logs with comprehensive search, filtering, sorting, and pagination capabilities. This composable wraps the `DeviceEventLogsApiService` to provide a reactive interface for querying and displaying device activity logs in the car wash system.

## Purpose

- Search and filter device event logs
- Support pagination for large datasets
- Filter by user, device, device type, and payment status
- Sort logs by different criteria
- Manage loading and error states
- Handle search parameters and pagination info

## Usage

### Basic Usage

```typescript
<script setup lang="ts">
import { useDeviceEventLogs } from '~/composables/useDeviceEventLogs'

const {
  eventLogs,
  totalLogs,
  totalPages,
  isSearching,
  error,
  searchEventLogs,
  goToPage,
  nextPage,
  previousPage
} = useDeviceEventLogs()

// Search on mount with default parameters
onMounted(async () => {
  await searchEventLogs()
})
</script>
```

### With Search Filters

```typescript
// Search with filters
await searchEventLogs({
  query: {
    device_type: 'WASH',
    payment_status: 'SUCCEEDED',
    search: 'เครื่องล้างรถ'
  },
  page: 1,
  limit: 20
})
```

### With Advanced Filters

```typescript
import type { EnumDeviceType, EnumPaymentStatus } from '~/types'

await searchEventLogs({
  query: {
    user_id: 'user-123',
    device_id: 'device-456',
    device_type: 'DRYING' as EnumDeviceType,
    payment_status: 'SUCCEEDED' as EnumPaymentStatus,
    payload_timestamp: '2025-01-15',
    search: 'search term'
  },
  page: 1,
  limit: 50,
  sort_by: 'created_at',
  sort_order: 'desc'
})
```

### Pagination

```typescript
// Navigate to next page
await nextPage()

// Navigate to previous page
await previousPage()

// Go to specific page
await goToPage(3)

// Refresh current search
await refreshSearch()
```

## API Reference

### State

| Property | Type | Description |
|----------|------|-------------|
| `eventLogs` | `DeviceEventLogResponseApi[]` | Array of event log items |
| `currentEventLog` | `DeviceEventLogResponseApi \| null` | Currently selected log (reserved for detail views) |
| `currentSearchParams` | `SearchDeviceEventLogsRequest` | Current search parameters including pagination |
| `totalLogs` | `number` | Total count of logs matching search criteria |
| `totalPages` | `number` | Total number of pages based on limit |
| `isLoading` | `boolean` | General loading state (reserved for future use) |
| `isSearching` | `boolean` | Active during search operations |
| `error` | `string \| null` | Error message (Thai language) |
| `successMessage` | `string \| null` | Success message (Thai language) |

**Note**: All state properties are exposed as `readonly` refs for safety.

### Methods

#### `searchEventLogs(searchParams?: SearchDeviceEventLogsRequest)`

Searches device event logs with optional filters and pagination.

- **Parameters**:
  - `searchParams` (optional): Search parameters object
- **Returns**: `Promise<void>`
- **Default Behavior**: If no params provided, uses current search params
- **Side Effects**:
  - Sets `isSearching` to `true` during search
  - Updates `eventLogs` with search results
  - Updates pagination info (`totalLogs`, `totalPages`)
  - Updates `currentSearchParams` with actual values from response
  - Sets `successMessage` on success
  - Sets `error` to "ไม่สามารถค้นหาบันทึกเหตุการณ์ได้" on failure
  - Clears previous messages before search

**Example**:
```typescript
// Use default/current parameters
await searchEventLogs()

// Search with specific filters
await searchEventLogs({
  query: { device_type: 'WASH' },
  page: 1,
  limit: 25
})
```

#### `goToPage(page: number)`

Navigate to a specific page number.

- **Parameters**:
  - `page`: Target page number (1-indexed)
- **Returns**: `Promise<void>`
- **Behavior**: Calls `searchEventLogs()` with updated page number while preserving other search params

**Example**:
```typescript
// Go to page 3
await goToPage(3)
```

#### `nextPage()`

Navigate to the next page (if available).

- **Parameters**: None
- **Returns**: `Promise<void>`
- **Behavior**:
  - Only executes if `currentPage < totalPages`
  - Increments page number and calls `searchEventLogs()`
  - No-op if already on last page

**Example**:
```typescript
// In pagination component
<VBtn
  :disabled="currentSearchParams.page >= totalPages"
  @click="nextPage"
>
  ถัดไป
</VBtn>
```

#### `previousPage()`

Navigate to the previous page (if available).

- **Parameters**: None
- **Returns**: `Promise<void>`
- **Behavior**:
  - Only executes if `currentPage > 1`
  - Decrements page number and calls `searchEventLogs()`
  - No-op if already on first page

**Example**:
```typescript
// In pagination component
<VBtn
  :disabled="currentSearchParams.page <= 1"
  @click="previousPage"
>
  ก่อนหน้า
</VBtn>
```

#### `refreshSearch()`

Re-run the current search with existing parameters.

- **Parameters**: None
- **Returns**: `Promise<void>`
- **Behavior**: Calls `searchEventLogs({})` to refresh data without changing params

**Example**:
```typescript
// Refresh button
<VBtn @click="refreshSearch">
  <VIcon>mdi-refresh</VIcon>
  รีเฟรช
</VBtn>
```

#### `clearMessages()`

Clear error and success messages.

- **Parameters**: None
- **Returns**: `void`
- **Side Effects**: Sets both `error` and `successMessage` to `null`

#### `resetState()`

Reset all state to initial values.

- **Parameters**: None
- **Returns**: `void`
- **Side Effects**:
  - Clears `eventLogs` array
  - Sets `currentEventLog` to `null`
  - Resets `currentSearchParams` to empty object
  - Clears pagination info
  - Calls `clearMessages()`

## Search Parameters

```typescript
interface SearchDeviceEventLogsRequest {
  query?: {
    user_id?: string              // Filter by user ID
    device_id?: string            // Filter by device ID
    device_type?: EnumDeviceType  // 'WASH' | 'DRYING'
    payment_status?: EnumPaymentStatus  // Payment status filter
    payload_timestamp?: string    // Filter by timestamp
    search?: string               // Search device_id or device_name
  }
  page?: number                   // Page number (1-indexed)
  limit?: number                  // Items per page
  sort_by?: 'created_at' | 'type' | 'device_id'  // Sort field
  sort_order?: 'asc' | 'desc'     // Sort direction
}
```

### Default Parameters

```typescript
{
  page: 1,
  limit: 10,
  sort_by: 'created_at',
  sort_order: 'desc'
}
```

## Response Structure

### DeviceEventLogResponseApi

```typescript
interface DeviceEventLogResponseApi {
  id: string                      // Event log unique ID
  device_id: string               // Associated device ID
  payload: {                      // Event payload (nullable)
    qr?: {                        // QR payment data
      net_amount?: number
      chargeId?: string
    }
    bank?: Record<string, number> // Bank payment breakdown
    coin?: Record<string, number> // Coin payment breakdown
    type?: EnumEventType          // Event type
    status?: EnumPaymentStatus    // Payment status
    timestamp?: number            // Event timestamp (unix)
    total_amount?: number         // Total amount
  } | null
  created_at: string              // ISO timestamp
  device: {                       // Related device info
    id: string
    name: string
    type: EnumDeviceType
    owner: {                      // Device owner info
      id: string
      fullname: string
      email: string
    }
  }
}
```

### PaginatedDeviceEventLogsResponse

```typescript
interface PaginatedDeviceEventLogsResponse {
  items: DeviceEventLogResponseApi[]  // Array of event logs
  total: number                        // Total count of logs
  page: number                         // Current page number
  limit: number                        // Items per page
  totalPages: number                   // Total pages available
}
```

## Example: Event Logs Page

### Complete Integration Example

```typescript
<script setup lang="ts">
import { useDeviceEventLogs } from '~/composables/useDeviceEventLogs'
import type { EnumDeviceType, EnumPaymentStatus } from '~/types'

const {
  eventLogs,
  totalLogs,
  totalPages,
  currentSearchParams,
  isSearching,
  error,
  searchEventLogs,
  goToPage,
  nextPage,
  previousPage,
  clearMessages
} = useDeviceEventLogs()

// Filter state (temporary)
const tempDeviceType = ref<EnumDeviceType>()
const tempPaymentStatus = ref<EnumPaymentStatus>()
const tempSearchQuery = ref('')

// Apply filters
const handleSearch = async () => {
  await searchEventLogs({
    query: {
      device_type: tempDeviceType.value,
      payment_status: tempPaymentStatus.value,
      search: tempSearchQuery.value || undefined
    },
    page: 1,  // Reset to first page on new search
    limit: 20
  })
}

// Clear filters
const handleClearFilters = async () => {
  tempDeviceType.value = undefined
  tempPaymentStatus.value = undefined
  tempSearchQuery.value = ''
  await searchEventLogs({
    page: 1,
    limit: 20
  })
}

// Pagination handler
const handlePageChange = (page: number) => {
  goToPage(page)
}

// Initialize on mount
onMounted(() => {
  searchEventLogs()
})

// Cleanup on unmount
onUnmounted(() => {
  clearMessages()
})
</script>

<template>
  <VContainer class="pa-6">
    <!-- Header -->
    <VRow class="mb-6">
      <VCol cols="12">
        <h1 class="text-h4 font-weight-bold">บันทึกเหตุการณ์</h1>
        <p class="text-subtitle-2 text-medium-emphasis">
          รายการบันทึกกิจกรรมของเครื่องทั้งหมด
        </p>
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

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" md="3">
            <VTextField
              v-model="tempSearchQuery"
              label="ค้นหา"
              placeholder="ชื่อเครื่อง, รหัสเครื่อง"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="tempDeviceType"
              :items="[
                { title: 'ทั้งหมด', value: undefined },
                { title: 'เครื่องล้าง', value: 'WASH' },
                { title: 'เครื่องเป่า', value: 'DRYING' }
              ]"
              label="ประเภทเครื่อง"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="tempPaymentStatus"
              :items="[
                { title: 'ทั้งหมด', value: undefined },
                { title: 'สำเร็จ', value: 'SUCCEEDED' },
                { title: 'ล้มเหลว', value: 'FAILED' }
              ]"
              label="สถานะการชำระเงิน"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </VCol>
          <VCol cols="12" md="3" class="d-flex ga-2">
            <VBtn
              color="primary"
              block
              @click="handleSearch"
              :loading="isSearching"
            >
              ค้นหา
            </VBtn>
            <VBtn
              variant="outlined"
              block
              @click="handleClearFilters"
            >
              ล้าง
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Data Table -->
    <VCard>
      <VCardText>
        <VDataTable
          :items="eventLogs"
          :loading="isSearching"
          :items-per-page="currentSearchParams.limit || 10"
          hide-default-footer
        >
          <template #item.device.name="{ item }">
            <div class="text-body-2 font-weight-medium">
              {{ item.device.name }}
            </div>
          </template>

          <template #item.device.type="{ item }">
            <VChip
              :color="item.device.type === 'WASH' ? 'primary' : 'secondary'"
              variant="tonal"
              size="small"
            >
              {{ item.device.type === 'WASH' ? 'เครื่องล้าง' : 'เครื่องเป่า' }}
            </VChip>
          </template>

          <template #item.payload.status="{ item }">
            <VChip
              v-if="item.payload?.status"
              :color="item.payload.status === 'SUCCEEDED' ? 'success' : 'error'"
              variant="tonal"
              size="small"
            >
              {{ item.payload.status === 'SUCCEEDED' ? 'สำเร็จ' : 'ล้มเหลว' }}
            </VChip>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <template #item.payload.total_amount="{ item }">
            <span v-if="item.payload?.total_amount" class="text-success">
              {{ item.payload.total_amount.toLocaleString('th-TH') }} ฿
            </span>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <template #item.created_at="{ item }">
            <span class="text-body-2">
              {{ new Date(item.created_at).toLocaleString('th-TH') }}
            </span>
          </template>
        </VDataTable>
      </VCardText>

      <!-- Pagination -->
      <VCardActions class="justify-space-between pa-4">
        <div class="text-body-2 text-medium-emphasis">
          แสดง {{ eventLogs.length }} รายการจากทั้งหมด {{ totalLogs }} รายการ
        </div>
        <div class="d-flex ga-2">
          <VBtn
            variant="outlined"
            size="small"
            :disabled="(currentSearchParams.page || 1) <= 1"
            @click="previousPage"
          >
            ก่อนหน้า
          </VBtn>
          <VBtn
            v-for="pageNum in totalPages"
            :key="pageNum"
            :variant="pageNum === currentSearchParams.page ? 'flat' : 'outlined'"
            :color="pageNum === currentSearchParams.page ? 'primary' : undefined"
            size="small"
            @click="handlePageChange(pageNum)"
          >
            {{ pageNum }}
          </VBtn>
          <VBtn
            variant="outlined"
            size="small"
            :disabled="(currentSearchParams.page || 1) >= totalPages"
            @click="nextPage"
          >
            ถัดไป
          </VBtn>
        </div>
      </VCardActions>
    </VCard>
  </VContainer>
</template>
```

### Simple List View

```typescript
<script setup lang="ts">
const { eventLogs, searchEventLogs } = useDeviceEventLogs()

onMounted(() => {
  searchEventLogs({ limit: 5 })  // Show only 5 recent logs
})
</script>

<template>
  <VList>
    <VListItem
      v-for="log in eventLogs"
      :key="log.id"
      :title="log.device.name"
      :subtitle="`${log.device.type} - ${new Date(log.created_at).toLocaleString('th-TH')}`"
    >
      <template #append>
        <VChip
          v-if="log.payload?.status"
          :color="log.payload.status === 'SUCCEEDED' ? 'success' : 'error'"
          size="small"
        >
          {{ log.payload.status }}
        </VChip>
      </template>
    </VListItem>
  </VList>
</template>
```

## Filter Patterns

### Temporary Filter State Pattern

```typescript
// Temporary filter variables
const tempDeviceType = ref<EnumDeviceType>()
const tempPaymentStatus = ref<EnumPaymentStatus>()
const tempSearch = ref('')

// Apply filters only on confirm
const applyFilters = async () => {
  await searchEventLogs({
    query: {
      device_type: tempDeviceType.value,
      payment_status: tempPaymentStatus.value,
      search: tempSearch.value || undefined
    },
    page: 1  // Reset to first page
  })
}

// Clear filters
const clearFilters = () => {
  tempDeviceType.value = undefined
  tempPaymentStatus.value = undefined
  tempSearch.value = ''
  searchEventLogs({ page: 1 })  // Search with no filters
}
```

## Pagination Logic

### Current Page Calculation

```typescript
const currentPage = computed(() => currentSearchParams.value.page || 1)
```

### Disable Previous Button

```typescript
const canGoPrevious = computed(() => currentPage.value > 1)
```

### Disable Next Button

```typescript
const canGoNext = computed(() => currentPage.value < totalPages.value)
```

### Page Range Display

```typescript
const pageRange = computed(() => {
  const start = ((currentPage.value - 1) * (currentSearchParams.value.limit || 10)) + 1
  const end = Math.min(start + eventLogs.value.length - 1, totalLogs.value)
  return `${start}-${end}`
})
```

## Error Handling

All errors are caught internally and displayed in Thai language:

- **Search error**: "ไม่สามารถค้นหาบันทึกเหตุการณ์ได้"
- **Success message**: Message from API response (Thai)

Errors are exposed via the `error` ref:

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

All interfaces are imported from the API service layer for consistency.

## Performance Considerations

- Default page size is 10 items (adjustable via `limit`)
- Searching is debounced through user interaction (manual search button)
- Previous search results are cleared before new search
- Pagination preserves all search filters automatically
- Empty results clear pagination info to prevent stale data

## State Management

This composable creates **local state** (not global). Each component that calls `useDeviceEventLogs()` gets its own isolated state instance.

If you need to share event logs across multiple components, consider:
1. Creating a Pinia store
2. Using `provide/inject` at parent component level
3. Lifting state to a common ancestor component

## Related Files

- **API Service**: `/catcar_wash_service_frontend/services/apis/device-event-logs-api.service.ts`
- **Type Definitions**: `/catcar_wash_service_frontend/types/index.ts`
- **Usage Examples**: Event logs page components

## Common Use Cases

### 1. Recent Activity Widget

```typescript
const { eventLogs, searchEventLogs } = useDeviceEventLogs()

onMounted(() => {
  searchEventLogs({
    limit: 5,
    sort_by: 'created_at',
    sort_order: 'desc'
  })
})
```

### 2. User-Specific Logs

```typescript
const userId = ref('user-123')

watch(userId, (newUserId) => {
  searchEventLogs({
    query: { user_id: newUserId },
    page: 1
  })
})
```

### 3. Device Activity Monitor

```typescript
const deviceId = ref('device-456')

const refreshDeviceActivity = () => {
  searchEventLogs({
    query: { device_id: deviceId.value },
    limit: 20
  })
}

// Auto-refresh every 30 seconds
useIntervalFn(refreshDeviceActivity, 30000)
```

## Version History

- **Initial Version**: Created with TypeScript, Composition API, pagination support, and Thai localization
- Follows Nuxt 3 best practices and Vue 3 Composition API patterns
