<template>
  <v-card elevation="2" rounded="lg" :class="cardClass">
    <!-- Card Title -->
    <v-card-title class="pa-6">
      <div class="d-flex justify-space-between align-center flex-wrap">
        <div class="d-flex align-center ga-3">
          <h2 class="text-h5 font-weight-bold">{{ title }}</h2>
          <slot name="title-append" />
        </div>
        <div class="d-flex align-center ga-2 flex-wrap">
          <v-chip
            variant="tonal"
            color="primary"
            size="small"
            class="text-caption"
          >
            {{ itemCountText }}
          </v-chip>
          <slot name="title-actions" />
        </div>
      </div>
    </v-card-title>

    <!-- Filter Section -->
    <v-card-text v-if="showFilters" class="pb-2">
      <!-- Custom filters slot -->
      <slot name="filters" :filter-manager="internalFilterManager" />

      <!-- Filter Change Alert -->
      <FilterChangeAlert
        :show="hasFilterChanges"
        :title="alertTitle"
        :message="alertMessage"
        :alert-class="alertClass"
      />

      <!-- Filter Actions -->
      <FilterActions
        v-if="showFilterActions"
        :clear-text="clearText"
        :apply-text="applyText"
        :container-class="actionsContainerClass"
        :disable-clear="disableClear"
        :disable-apply="disableApply"
        :apply-loading="applyLoading"
        :clear-loading="clearLoading"
        :button-size="buttonSize"
        :button-variant="buttonVariant"
        @clear="handleClearFilters"
        @apply="handleApplyFilters"
      />
    </v-card-text>

    <!-- Data Table -->
    <v-data-table
      :headers="processedHeaders"
      :items="processedItems"
      :loading="loading"
      :items-per-page="itemsPerPage"
      :class="tableClasses"
      :hover="hover"
      :show-expand="showExpand"
      :expand-on-click="expandOnClick"
      :show-select="showSelect"
      :selection-mode="selectionMode"
      :return-object="returnObject"
      :dense="dense"
      :fixed-header="fixedHeader"
      :height="height"
      :hide-default-footer="hideDefaultFooter"
      :footer-props="footerProps"
      :item-key="itemKey"
      :search="search"
      :custom-filter="customFilter"
      :multi-sort="multiSort"
      :must-sort="mustSort"
      :server-items-length="serverItemsLength"
      v-bind="tableProps"
      @click:row="handleRowClick"
      @update:sort-by="handleSortUpdate"
      @update:page="handlePageUpdate"
      @update:items-per-page="handleItemsPerPageUpdate"
      @update:selected="handleSelectionUpdate"
      @update:expanded="handleExpandUpdate"
    >
      <!-- Header slots -->
      <template
        v-for="header in visibleHeaders"
        :key="`header.${header.key}`"
        #[`header.${header.key}`]="slotProps"
      >
        <slot :name="`header.${header.key}`" v-bind="slotProps">
          <span :class="header.class">{{ header.title }}</span>
        </slot>
      </template>

      <!-- Item column slots -->
      <template
        v-for="header in visibleHeaders"
        :key="`item.${header.key}`"
        #[`item.${header.key}`]="slotProps"
      >
        <slot :name="`item.${header.key}`" v-bind="enhancedItemSlotProps(slotProps, header)">
          <span :class="header.cellClass">
            {{ getNestedValue(slotProps.item, header.key) }}
          </span>
        </slot>
      </template>

      <!-- Expandable row content -->
      <template v-if="showExpand" #expanded-row="{ columns, item }">
        <td :colspan="columns.length" class="pa-0">
          <slot name="expanded-row" :item="item" :columns="columns" :index="getItemIndex(item)" />
        </td>
      </template>

      <!-- Loading slot -->
      <template v-if="$slots.loading" #loading>
        <slot name="loading" />
      </template>

      <!-- No data slot -->
      <template v-if="$slots['no-data']" #no-data>
        <slot name="no-data" />
      </template>

      <!-- Top slot -->
      <template v-if="$slots.top" #top="slotProps">
        <slot name="top" v-bind="slotProps" />
      </template>

      <!-- Bottom slot -->
      <template v-if="$slots.bottom" #bottom="slotProps">
        <slot name="bottom" v-bind="slotProps" />
      </template>

      <!-- Footer slot -->
      <template v-if="$slots.footer" #footer="slotProps">
        <slot name="footer" v-bind="slotProps" />
      </template>

      <!-- Body prepend slot -->
      <template v-if="$slots['body.prepend']" #body.prepend="slotProps">
        <slot name="body.prepend" v-bind="slotProps" />
      </template>

      <!-- Body append slot -->
      <template v-if="$slots['body.append']" #body.append="slotProps">
        <slot name="body.append" v-bind="slotProps" />
      </template>

      <!-- Passthrough remaining Vuetify slots -->
      <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
        <slot v-if="!isReservedSlot(name)" :name="name" v-bind="slotData" />
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { computed, shallowRef, readonly, type Component } from 'vue'
import type {
  BaseDataTableProps,
  BaseDataTableEvents,
  DataTableHeader,
  DataTableItem,
  SortOption,
  FilterManager
} from '~/types/data-table'
import FilterChangeAlert from './FilterChangeAlert.vue'
import FilterActions from './FilterActions.vue'

// =============================================================================
// PROPS & EMITS
// =============================================================================

interface Props extends BaseDataTableProps {
  // Filter-related props
  alertTitle?: string
  alertMessage?: string
  alertClass?: string
  clearText?: string
  applyText?: string
  actionsContainerClass?: string
  disableClear?: boolean
  disableApply?: boolean
  applyLoading?: boolean
  clearLoading?: boolean
  buttonSize?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  buttonVariant?: 'text' | 'flat' | 'elevated' | 'tonal' | 'outlined' | 'plain'

  // Performance props
  virtualScrolling?: boolean
  itemHeight?: number

  // Filter manager (optional external)
  filterManager?: FilterManager
}

const props = withDefaults(defineProps<Props>(), {
  // Table props
  loading: false,
  itemsPerPage: 10,
  showFilters: true,
  showFilterActions: true,
  hasFilterChanges: false,
  showExpand: true,
  expandOnClick: true,
  cardClass: '',
  tableClass: '',
  hover: true,
  showSelect: false,
  selectionMode: 'multiple',
  returnObject: false,
  dense: false,
  fixedHeader: false,
  hideDefaultFooter: false,
  disableSort: false,
  multiSort: false,
  mustSort: false,
  serverSide: false,
  itemKey: 'id',

  // Filter props
  alertTitle: 'เตือน:',
  alertMessage: 'คุณได้เปลี่ยนแปลงตัวกรองแล้ว กรุณากดปุ่ม "ยืนยันตัวกรอง" เพื่อใช้งานตัวกรองใหม่',
  alertClass: 'my-2',
  clearText: 'ล้างตัวกรอง',
  applyText: 'ยืนยันตัวกรอง',
  actionsContainerClass: 'mb-2',
  disableClear: false,
  disableApply: false,
  applyLoading: false,
  clearLoading: false,
  buttonSize: 'small',
  buttonVariant: 'outlined',

  // Performance props
  virtualScrolling: false,
  itemHeight: 48
})

const emit = defineEmits<BaseDataTableEvents>()

// =============================================================================
// REACTIVE STATE
// =============================================================================

/**
 * Internal filter manager (if not provided externally)
 */
const internalFilterManager = shallowRef<FilterManager | null>(null)

/**
 * Selected items for multi-select functionality
 */
const selectedItems = shallowRef<DataTableItem[]>([])

/**
 * Expanded items tracking
 */
const expandedItems = shallowRef<string[]>([])

/**
 * Current sort configuration
 */
const currentSort = shallowRef<SortOption[]>([])

// =============================================================================
// COMPUTED PROPERTIES
// =============================================================================

/**
 * Get the active filter manager (external or internal)
 */
const activeFilterManager = computed(() => {
  return props.filterManager || internalFilterManager.value
})

/**
 * Process headers to add visibility and computed properties
 */
const processedHeaders = computed(() => {
  return props.headers
    .filter(header => header.visible !== false)
    .map(header => ({
      ...header,
      sortable: header.sortable !== false && !props.disableSort,
      class: [header.class, 'text-no-wrap'].filter(Boolean).join(' ')
    }))
})

/**
 * Get visible headers for slot generation
 */
const visibleHeaders = computed(() => processedHeaders.value)

/**
 * Process items for display
 */
const processedItems = computed(() => {
  if (props.virtualScrolling && props.items.length > 1000) {
    // For very large datasets, return a reference without processing
    return readonly(props.items)
  }
  return props.items
})

/**
 * Generate item count text
 */
const itemCountText = computed(() => {
  const count = props.items.length
  return `${count.toLocaleString('th-TH')} รายการ`
})

/**
 * Generate table CSS classes
 */
const tableClasses = computed(() => {
  const classes = ['elevation-0']

  if (props.tableClass) {
    classes.push(props.tableClass)
  }

  if (props.dense) {
    classes.push('dense-table')
  }

  if (props.virtualScrolling) {
    classes.push('virtual-scroll-table')
  }

  return classes.join(' ')
})

/**
 * Extract additional table props for v-data-table
 */
const tableProps = computed(() => {
  // Extract only the props that should be passed to v-data-table
  const {
    title, headers, items, showFilters, showFilterActions, hasFilterChanges,
    cardClass, tableClass, alertTitle, alertMessage, alertClass,
    clearText, applyText, actionsContainerClass, disableClear, disableApply,
    applyLoading, clearLoading, buttonSize, buttonVariant, virtualScrolling,
    itemHeight, filterManager, ...tableOnlyProps
  } = props

  return tableOnlyProps
})

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get nested value from object using dot notation
 * Optimized version with better performance for deep objects
 */
const getNestedValue = (obj: DataTableItem, path: string): unknown => {
  if (!obj || typeof obj !== 'object') return undefined

  const keys = path.split('.')
  let current: any = obj

  for (const key of keys) {
    if (current === null || current === undefined) return undefined
    current = current[key]
  }

  return current
}

/**
 * Check if slot name is reserved by the component
 */
const isReservedSlot = (name: string): boolean => {
  const reservedSlots = [
    'filters',
    'expanded-row',
    'loading',
    'no-data',
    'top',
    'bottom',
    'footer',
    'body.prepend',
    'body.append',
    'title-append',
    'title-actions',
    ...visibleHeaders.value.map(h => `header.${h.key}`),
    ...visibleHeaders.value.map(h => `item.${h.key}`)
  ]

  return reservedSlots.includes(name)
}

/**
 * Get item index for expanded row tracking
 */
const getItemIndex = (item: DataTableItem): number => {
  return props.items.findIndex(i => i[props.itemKey] === item[props.itemKey])
}

/**
 * Enhance item slot props with additional metadata
 */
const enhancedItemSlotProps = (slotProps: any, header: DataTableHeader) => {
  return {
    ...slotProps,
    value: getNestedValue(slotProps.item, header.key),
    column: header,
    index: getItemIndex(slotProps.item),
    isSelected: selectedItems.value.some(selected =>
      selected[props.itemKey] === slotProps.item[props.itemKey]
    ),
    isExpanded: expandedItems.value.includes(String(slotProps.item[props.itemKey]))
  }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle apply filters action
 */
const handleApplyFilters = (): void => {
  activeFilterManager.value?.applyFilters()
  emit('applyFilters')
}

/**
 * Handle clear filters action
 */
const handleClearFilters = (): void => {
  activeFilterManager.value?.clearAllFilters()
  emit('clearFilters')
}

/**
 * Handle row click events
 */
const handleRowClick = (event: Event, { item }: { item: DataTableItem }): void => {
  emit('click:row', { event, item })
}

/**
 * Handle sort updates
 */
const handleSortUpdate = (sortBy: SortOption[]): void => {
  currentSort.value = sortBy
  emit('update:sortBy', sortBy)
}

/**
 * Handle page updates
 */
const handlePageUpdate = (page: number): void => {
  emit('update:page', page)
}

/**
 * Handle items per page updates
 */
const handleItemsPerPageUpdate = (itemsPerPage: number): void => {
  emit('update:itemsPerPage', itemsPerPage)
}

/**
 * Handle selection updates
 */
const handleSelectionUpdate = (selected: DataTableItem[]): void => {
  selectedItems.value = selected
  emit('update:selected', selected)
}

/**
 * Handle expand/collapse updates
 */
const handleExpandUpdate = (expanded: string[]): void => {
  expandedItems.value = expanded
  emit('update:expanded', expanded)
}

// =============================================================================
// LIFECYCLE & CLEANUP
// =============================================================================

/**
 * Initialize internal filter manager if needed
 */
if (!props.filterManager) {
  // Only import and create if needed to avoid unnecessary bundle size
  import('~/composables/useFilterManager').then(({ useFilterManager }) => {
    internalFilterManager.value = useFilterManager()
  })
}
</script>

<style scoped>
/* =============================================================================
   ENHANCED BASE DATA TABLE STYLES
   ============================================================================= */

/* Enhanced visual hierarchy */
:deep(.v-card-title) {
  font-size: 1.125rem !important;
  font-weight: 600 !important;
  letter-spacing: -0.025em !important;
  padding: 20px 24px 8px 24px !important;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
}

/* Table optimizations */
:deep(.v-data-table) {
  --v-table-row-height: 56px;
  background: transparent;
}

:deep(.v-data-table .v-data-table__th) {
  background: rgba(var(--v-theme-surface-container-high), 1);
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.87);
  white-space: nowrap;
  padding: 0 16px;
  height: 48px;
}

:deep(.v-data-table .v-data-table__td) {
  padding: 0 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.05);
  vertical-align: middle;
}

/* Dense table styling */
:deep(.dense-table) {
  --v-table-row-height: 40px;
}

:deep(.dense-table .v-data-table__th) {
  height: 36px;
  padding: 0 12px;
  font-size: 0.875rem;
}

:deep(.dense-table .v-data-table__td) {
  padding: 0 12px;
  font-size: 0.875rem;
}

/* Virtual scrolling optimizations */
:deep(.virtual-scroll-table) {
  contain: layout style paint;
}

:deep(.virtual-scroll-table .v-data-table__wrapper) {
  overflow: auto;
  overscroll-behavior: contain;
}

/* Expand/collapse animations */
:deep(.v-data-table__expanded-row) {
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(var(--v-theme-surface-container-low), 1);
}

:deep(.v-data-table__expanded-row td) {
  border-bottom: none;
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

/* Row hover effects */
:deep(.v-data-table .v-data-table__tr:hover) {
  background: rgba(var(--v-theme-primary), 0.04) !important;
}

/* Selection styles */
:deep(.v-data-table .v-data-table__tr--selected) {
  background: rgba(var(--v-theme-primary), 0.08) !important;
}

:deep(.v-data-table .v-data-table__tr--selected:hover) {
  background: rgba(var(--v-theme-primary), 0.12) !important;
}

/* Loading state */
:deep(.v-data-table .v-data-table__progress) {
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(2px);
}

/* No data state */
:deep(.v-data-table .v-data-table__empty-wrapper) {
  padding: 48px 24px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Improved chip spacing in table cells */
:deep(.v-data-table .v-chip) {
  margin: 2px;
}

/* Text wrapping for long content */
:deep(.v-data-table .text-wrap) {
  white-space: normal !important;
  word-break: break-word;
}

/* Monospace text for IDs and codes */
:deep(.v-data-table .text-monospace) {
  font-family: 'Roboto Mono', 'Monaco', 'Consolas', monospace;
  font-size: 0.875rem;
  letter-spacing: 0;
}

/* Enhanced table footer */
:deep(.v-data-table-footer) {
  background: rgba(var(--v-theme-surface-container), 1);
  border-top: 1px solid rgba(var(--v-border-color), 0.08);
  padding: 8px 16px;
}

/* Mobile responsiveness */
@media (max-width: 960px) {
  :deep(.v-card-title) {
    font-size: 1rem !important;
    padding: 16px 20px 8px 20px !important;
  }

  :deep(.v-data-table .v-data-table__th),
  :deep(.v-data-table .v-data-table__td) {
    padding: 0 8px;
    font-size: 0.875rem;
  }

  :deep(.v-data-table) {
    --v-table-row-height: 48px;
  }

  :deep(.dense-table) {
    --v-table-row-height: 36px;
  }

  :deep(.dense-table .v-data-table__th),
  :deep(.dense-table .v-data-table__td) {
    padding: 0 6px;
    font-size: 0.8125rem;
  }
}

@media (max-width: 600px) {
  :deep(.v-card-title) {
    font-size: 0.875rem !important;
    padding: 12px 16px 6px 16px !important;
  }

  :deep(.v-data-table .v-data-table__th),
  :deep(.v-data-table .v-data-table__td) {
    padding: 0 6px;
    font-size: 0.8125rem;
  }

  :deep(.v-data-table) {
    --v-table-row-height: 44px;
  }

  :deep(.dense-table) {
    --v-table-row-height: 32px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :deep(.v-data-table .v-data-table__th) {
    background: rgba(var(--v-theme-surface), 1);
    border: 1px solid rgba(var(--v-border-color), 0.3);
  }

  :deep(.v-data-table .v-data-table__td) {
    border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  :deep(.v-data-table__expanded-row) {
    animation: none;
  }

  :deep(.v-data-table .v-data-table__tr) {
    transition: none;
  }
}

/* Performance optimization: GPU acceleration for large tables */
:deep(.virtual-scroll-table .v-data-table__wrapper) {
  transform: translateZ(0);
  will-change: scroll-position;
}

/* Focus indicators for accessibility */
:deep(.v-data-table .v-data-table__tr:focus-visible) {
  outline: 2px solid rgba(var(--v-theme-primary), 1);
  outline-offset: -2px;
}

:deep(.v-data-table .v-data-table__th:focus-visible) {
  outline: 2px solid rgba(var(--v-theme-primary), 1);
  outline-offset: -2px;
}

/* Print styles */
@media print {
  :deep(.v-card) {
    box-shadow: none !important;
    border: 1px solid #000;
  }

  :deep(.v-data-table .v-data-table__th) {
    background: #f5f5f5 !important;
    color: #000 !important;
  }

  :deep(.v-data-table .v-data-table__tr:hover) {
    background: transparent !important;
  }
}
</style>