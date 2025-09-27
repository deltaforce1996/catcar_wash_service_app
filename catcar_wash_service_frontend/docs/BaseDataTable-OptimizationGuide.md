# BaseDataTable Optimization Guide

## Overview

This guide covers the optimization and refactoring of the Vue 3 BaseDataTable component system with improved TypeScript, reactivity patterns, and Vuetify 3 integration.

## What's Been Optimized

### 1. TypeScript Improvements ✅

**Before:**
```typescript
interface Header {
  title: string;
  key: string;
  sortable?: boolean;
  [key: string]: unknown;
}
```

**After:**
```typescript
// Comprehensive type definitions in types/data-table.ts
export interface DataTableHeader {
  title: string
  key: string
  sortable?: boolean
  width?: string | number
  minWidth?: string | number
  maxWidth?: string | number
  align?: 'start' | 'center' | 'end'
  fixed?: boolean
  class?: string
  cellClass?: string
  visible?: boolean
  [key: string]: unknown
}
```

### 2. Filter Management System ✅

**New Filter Management Composable:**
```typescript
// composables/useFilterManager.ts
const {
  registerField,
  values,
  hasChanges,
  applyFilters,
  clearAllFilters
} = useFilterManager<{
  search: string
  status: string[]
  dateRange: [string, string] | null
}>()

// Register filter fields with type safety
registerField('search', {
  type: 'text',
  placeholder: 'ค้นหา...',
  defaultValue: ''
})
```

### 3. Enhanced Component Architecture ✅

**BaseDataTable Optimizations:**
- **Performance**: Uses `shallowRef` and `readonly` for optimal reactivity
- **Flexibility**: Enhanced slot system with more customization options
- **Accessibility**: Improved ARIA labels and focus management
- **TypeScript**: Full type safety throughout the component
- **Virtual Scrolling**: Support for large datasets (1000+ items)

**SearchFilter Optimizations:**
- **Debouncing**: Configurable debounce timing (default 300ms)
- **Minimum Length**: Only trigger search after N characters
- **Loading States**: Visual feedback during search operations
- **Keyboard Support**: Enter to search, Escape to clear
- **Accessibility**: Enhanced ARIA labels and focus indicators

**FilterActions Optimizations:**
- **Customization**: Separate variants for clear/apply buttons
- **Loading States**: Individual loading states for each button
- **Haptic Feedback**: Optional vibration on mobile devices
- **Flexibility**: Slot-based content customization

## Migration Guide

### Step 1: Update Imports

**Before:**
```vue
<script setup lang="ts">
// Basic interface definitions in component
interface Header {
  title: string;
  key: string;
  sortable?: boolean;
}
</script>
```

**After:**
```vue
<script setup lang="ts">
import type { DataTableHeader, DataTableItem } from '~/types/data-table'
import { useFilterManager } from '~/composables/useFilterManager'
</script>
```

### Step 2: Replace BaseDataTable Usage

**Before:**
```vue
<BaseDataTable
  title="รายการข้อมูล"
  :headers="headers"
  :items="items"
  :has-filter-changes="hasChanges"
  @apply-filters="applyFilters"
  @clear-filters="clearFilters"
>
  <template #filters>
    <!-- Manual filter implementation -->
  </template>
</BaseDataTable>
```

**After:**
```vue
<!-- Use the optimized version -->
<BaseDataTableOptimized
  title="รายการข้อมูล"
  :headers="headers"
  :items="items"
  :has-filter-changes="filterManager.hasChanges.value"
  :filter-manager="filterManager"
  virtual-scrolling
  @apply-filters="handleApplyFilters"
  @clear-filters="handleClearFilters"
>
  <template #filters="{ filterManager }">
    <!-- Use the filter manager -->
    <SearchFilter
      v-model="filterManager.getField('search')?.value.value"
      placeholder="ค้นหาข้อมูล"
      :debounce="300"
      :min-length="2"
    />
  </template>
</BaseDataTableOptimized>
```

### Step 3: Implement Filter Management

**Before:**
```vue
<script setup lang="ts">
const searchQuery = ref("")
const statusFilter = ref<string[]>([])
const tempSearchQuery = ref("")
const tempStatusFilter = ref<string[]>([])

const hasChanges = computed(() => {
  return searchQuery.value !== tempSearchQuery.value ||
         JSON.stringify(statusFilter.value) !== JSON.stringify(tempStatusFilter.value)
})

const applyFilters = () => {
  searchQuery.value = tempSearchQuery.value
  statusFilter.value = [...tempStatusFilter.value]
}
</script>
```

**After:**
```vue
<script setup lang="ts">
// Create filter manager with type safety
const filterManager = useFilterManager<{
  search: string
  status: string[]
  dateRange: [string, string] | null
}>()

// Register fields with configuration
filterManager.registerField('search', {
  type: 'text',
  placeholder: 'ค้นหา...',
  defaultValue: '',
  immediate: false
})

filterManager.registerField('status', {
  type: 'multiselect',
  label: 'สถานะ',
  options: ['ACTIVE', 'INACTIVE'],
  defaultValue: []
})

// Use computed properties for reactive filtering
const filteredItems = computed(() => {
  let filtered = items.value
  const filters = filterManager.values.value

  if (filters.search) {
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(filters.search.toLowerCase())
    )
  }

  if (filters.status.length > 0) {
    filtered = filtered.filter(item =>
      filters.status.includes(item.status)
    )
  }

  return filtered
})
</script>
```

### Step 4: Enhanced SearchFilter Usage

**Before:**
```vue
<SearchFilter
  v-model="tempSearchQuery"
  placeholder="ค้นหา..."
/>
```

**After:**
```vue
<SearchFilter
  v-model="searchValue"
  placeholder="ค้นหาด้วยชื่อ อีเมล หรือเบอร์โทร"
  :debounce="300"
  :min-length="2"
  show-search-indicator
  search-indicator-color="primary"
  auto-focus
  show-loading-indicator
>
  <template #prepend-inner>
    <v-icon color="primary">mdi-magnify</v-icon>
  </template>
</SearchFilter>
```

### Step 5: Enhanced FilterActions Usage

**Before:**
```vue
<FilterActions
  @clear="clearFilters"
  @apply="applyFilters"
/>
```

**After:**
```vue
<FilterActions
  clear-text="ล้างทั้งหมด"
  apply-text="ค้นหา"
  :clear-loading="clearLoading"
  :apply-loading="applyLoading"
  :disable-apply="!hasValidFilters"
  clear-button-variant="outlined"
  apply-button-variant="elevated"
  direction="row"
  @clear="handleClearFilters"
  @apply="handleApplyFilters"
>
  <template #additional-actions="{ clear, apply }">
    <v-btn variant="text" size="small" @click="resetToDefaults">
      รีเซ็ต
    </v-btn>
  </template>
</FilterActions>
```

## Performance Optimizations

### 1. Reactivity Optimizations

```typescript
// Use shallowRef for large datasets
const items = shallowRef<DataTableItem[]>([])

// Use readonly for computed values
const processedItems = computed(() => readonly(items.value))

// Optimize watchers with shallow comparison
watch(
  () => filterManager.values.value,
  (newFilters) => {
    // Only update if references changed
    applyClientSideFilters(newFilters)
  },
  { flush: 'post' } // Run after DOM updates
)
```

### 2. Virtual Scrolling

```vue
<BaseDataTableOptimized
  :items="largeDataset"
  virtual-scrolling
  :item-height="48"
  :height="400"
/>
```

### 3. Computed Property Optimization

```typescript
// Memoize expensive calculations
const expensiveComputed = computed(() => {
  // Use Map for O(1) lookups instead of Array.find
  const itemMap = new Map(items.value.map(item => [item.id, item]))

  return filteredIds.value.map(id => itemMap.get(id)).filter(Boolean)
})
```

## Advanced Usage Examples

### Custom Filter Field Types

```typescript
// Register custom filter with validation
filterManager.registerField('priceRange', {
  type: 'number',
  label: 'ช่วงราคา',
  defaultValue: [0, 1000],
  rules: [
    (value: [number, number]) =>
      value[0] <= value[1] || 'ราคาเริ่มต้นต้องน้อยกว่าราคาสิ้นสุด'
  ]
})
```

### Dynamic Header Configuration

```typescript
const headers = computed<DataTableHeader[]>(() => [
  {
    title: 'ชื่อ',
    key: 'name',
    sortable: true,
    width: 200,
    class: 'font-weight-bold',
    cellClass: 'text-primary'
  },
  {
    title: 'สถานะ',
    key: 'status',
    sortable: true,
    align: 'center',
    visible: showStatusColumn.value
  },
  {
    title: 'จำนวนเงิน',
    key: 'amount',
    sortable: true,
    align: 'end',
    cellClass: 'text-success font-weight-bold'
  }
])
```

### Complex Filtering Logic

```typescript
const complexFilter = computed(() => {
  return (item: DataTableItem) => {
    const filters = filterManager.values.value

    // Text search across multiple fields
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const searchableFields = [item.name, item.email, item.phone].filter(Boolean)
      if (!searchableFields.some(field =>
        field.toLowerCase().includes(searchLower)
      )) {
        return false
      }
    }

    // Date range filtering
    if (filters.dateRange && filters.dateRange.length === 2) {
      const itemDate = new Date(item.created_at)
      const [start, end] = filters.dateRange.map(d => new Date(d))
      if (itemDate < start || itemDate > end) {
        return false
      }
    }

    return true
  }
})

const filteredItems = computed(() =>
  items.value.filter(complexFilter.value)
)
```

## Best Practices

### 1. Component Organization

```
components/
├── common/
│   ├── BaseDataTableOptimized.vue    # Main table component
│   ├── SearchFilter.vue              # Enhanced search
│   ├── FilterActions.vue             # Enhanced actions
│   └── FilterChangeAlert.vue         # Status indicator
├── filters/
│   ├── DateRangeFilter.vue          # Custom date range
│   ├── StatusFilter.vue             # Custom status filter
│   └── CategoryFilter.vue           # Custom category filter
└── table/
    ├── CustomerTable.vue            # Specific table implementations
    └── ProductTable.vue
```

### 2. Composable Organization

```
composables/
├── useFilterManager.ts              # Main filter management
├── useTablePagination.ts            # Pagination logic
├── useTableSort.ts                  # Sorting logic
└── useTableExport.ts                # Export functionality
```

### 3. Type Safety

```typescript
// Define specific item types
interface CustomerItem extends DataTableItem {
  id: string
  name: string
  email: string
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
}

// Use typed filter manager
const customerFilterManager = useFilterManager<{
  search: string
  status: CustomerItem['status'][]
  dateRange: [string, string] | null
}>()
```

### 4. Performance Monitoring

```typescript
// Monitor filter performance
const filterPerformance = ref({
  lastFilterTime: 0,
  averageFilterTime: 0,
  filterCount: 0
})

const monitoredFilter = computed(() => {
  const start = performance.now()
  const result = expensiveFilter()
  const duration = performance.now() - start

  filterPerformance.value.lastFilterTime = duration
  filterPerformance.value.filterCount++
  filterPerformance.value.averageFilterTime =
    (filterPerformance.value.averageFilterTime + duration) / 2

  return result
})
```

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure all imports from `~/types/data-table` are correct
2. **Reactivity Issues**: Use `shallowRef` for large datasets, `ref` for primitive values
3. **Performance Problems**: Enable virtual scrolling for large datasets
4. **Filter State**: Use the filter manager for consistent state management

### Debugging Tools

```typescript
// Add to development environment
if (process.env.NODE_ENV === 'development') {
  // Monitor filter manager state
  watch(
    () => filterManager.getFilterSummary(),
    (summary) => {
      console.log('Filter Summary:', summary)
    },
    { deep: true }
  )

  // Performance monitoring
  const performanceObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('filter')) {
        console.log(`Filter operation: ${entry.duration}ms`)
      }
    })
  })
  performanceObserver.observe({ entryTypes: ['measure'] })
}
```

This optimization guide provides a comprehensive approach to migrating and using the enhanced BaseDataTable component system with Vue 3, TypeScript, and Vuetify 3 best practices.