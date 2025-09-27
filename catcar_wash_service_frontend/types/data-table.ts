/**
 * Comprehensive TypeScript definitions for the BaseDataTable component system
 * Follows Vue 3 + TypeScript + Vuetify 3 best practices
 */

import type { ComputedRef, Ref } from 'vue'

// =============================================================================
// CORE INTERFACES
// =============================================================================

/**
 * Enhanced table header definition with comprehensive options
 */
export interface DataTableHeader {
  /** Display title for the column */
  title: string
  /** Unique key for data access (supports dot notation for nested objects) */
  key: string
  /** Whether column is sortable */
  sortable?: boolean
  /** Column width (CSS value) */
  width?: string | number
  /** Minimum column width */
  minWidth?: string | number
  /** Maximum column width */
  maxWidth?: string | number
  /** Text alignment */
  align?: 'start' | 'center' | 'end'
  /** Whether column is fixed */
  fixed?: boolean
  /** Custom class for header */
  class?: string
  /** Custom class for cell content */
  cellClass?: string
  /** Whether column is visible */
  visible?: boolean
  /** Additional Vuetify props */
  [key: string]: unknown
}

/**
 * Generic data item type with flexible structure
 */
export type DataTableItem = Record<string, unknown>

/**
 * Sort configuration
 */
export interface SortOption {
  key: string
  order: 'asc' | 'desc'
}

/**
 * Pagination configuration
 */
export interface PaginationOptions {
  page: number
  itemsPerPage: number
  sortBy?: SortOption[]
}

// =============================================================================
// FILTER SYSTEM INTERFACES
// =============================================================================

/**
 * Base filter value type
 */
export type FilterValue = string | number | boolean | string[] | number[] | null | undefined

/**
 * Filter field definition
 */
export interface FilterField<T = FilterValue> {
  /** Filter identifier */
  key: string
  /** Current filter value */
  value: Ref<T>
  /** Temporary value for pending changes */
  tempValue: Ref<T>
  /** Filter type for UI rendering */
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean'
  /** Display label */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Available options for select/multiselect */
  options?: readonly unknown[]
  /** Validation rules */
  rules?: Array<(value: T) => boolean | string>
  /** Whether filter is currently active */
  isActive: ComputedRef<boolean>
  /** Clear filter method */
  clear: () => void
  /** Apply temp value to actual value */
  apply: () => void
  /** Reset temp value to current value */
  reset: () => void
}

/**
 * Filter manager composable interface
 */
export interface FilterManager<T extends Record<string, FilterValue> = Record<string, FilterValue>> {
  /** Filter fields registry */
  fields: Readonly<Record<keyof T, FilterField>>
  /** Current filter values */
  values: Readonly<T>
  /** Temporary filter values */
  tempValues: T
  /** Whether any filters have pending changes */
  hasChanges: ComputedRef<boolean>
  /** Whether any filters are currently active */
  hasActiveFilters: ComputedRef<boolean>
  /** Count of active filters */
  activeFilterCount: ComputedRef<number>
  /** Apply all pending filter changes */
  applyFilters: () => void
  /** Clear all filters */
  clearAllFilters: () => void
  /** Reset all temp values */
  resetTempValues: () => void
  /** Register a new filter field */
  registerField: <K extends keyof T>(key: K, config: Omit<FilterField<T[K]>, 'key' | 'value' | 'tempValue' | 'isActive' | 'clear' | 'apply' | 'reset'>) => void
  /** Unregister a filter field */
  unregisterField: (key: keyof T) => void
}

// =============================================================================
// COMPONENT PROPS INTERFACES
// =============================================================================

/**
 * BaseDataTable component props with comprehensive configuration
 */
export interface BaseDataTableProps {
  /** Table title */
  title: string
  /** Table headers configuration */
  headers: DataTableHeader[]
  /** Table data items */
  items: DataTableItem[]
  /** Loading state */
  loading?: boolean
  /** Items per page */
  itemsPerPage?: number
  /** Show filters section */
  showFilters?: boolean
  /** Show filter action buttons */
  showFilterActions?: boolean
  /** Whether filters have pending changes */
  hasFilterChanges?: boolean
  /** Show expand functionality */
  showExpand?: boolean
  /** Expand on row click */
  expandOnClick?: boolean
  /** Custom card classes */
  cardClass?: string
  /** Custom table classes */
  tableClass?: string
  /** Disable sorting */
  disableSort?: boolean
  /** Fixed header */
  fixedHeader?: boolean
  /** Table height (enables virtual scrolling for large datasets) */
  height?: string | number
  /** Enable selection */
  showSelect?: boolean
  /** Selection mode */
  selectionMode?: 'single' | 'multiple'
  /** Return object for v-model */
  returnObject?: boolean
  /** Dense table styling */
  dense?: boolean
  /** Hide default footer */
  hideDefaultFooter?: boolean
  /** Custom footer props */
  footerProps?: Record<string, unknown>
  /** Hover effect on rows */
  hover?: boolean
  /** Item key for tracking */
  itemKey?: string
  /** Search functionality */
  search?: string
  /** Custom search function */
  customFilter?: (value: string, search: string, item: DataTableItem) => boolean
  /** Multi-sort capability */
  multiSort?: boolean
  /** Must sort (cannot remove sorting) */
  mustSort?: boolean
  /** Server-side pagination/sorting */
  serverSide?: boolean
  /** Total items count for server-side pagination */
  serverItemsLength?: number
}

/**
 * SearchFilter component props
 */
export interface SearchFilterProps {
  /** Current search value */
  modelValue: string
  /** Placeholder text */
  placeholder?: string
  /** ARIA label for accessibility */
  ariaLabel?: string
  /** Disable the input */
  disabled?: boolean
  /** Clear button */
  clearable?: boolean
  /** Loading state */
  loading?: boolean
  /** Prepend icon */
  prependIcon?: string
  /** Prepend inner icon */
  prependInnerIcon?: string
  /** Append icon */
  appendIcon?: string
  /** Append inner icon */
  appendInnerIcon?: string
  /** Variant style */
  variant?: 'filled' | 'outlined' | 'plain' | 'underlined' | 'solo' | 'solo-inverted' | 'solo-filled'
  /** Density */
  density?: 'default' | 'comfortable' | 'compact'
  /** Hide details */
  hideDetails?: boolean | 'auto'
  /** Debounce delay in milliseconds */
  debounce?: number
}

/**
 * FilterActions component props
 */
export interface FilterActionsProps {
  /** Clear button text */
  clearText?: string
  /** Apply button text */
  applyText?: string
  /** Container CSS classes */
  containerClass?: string
  /** Disable clear button */
  disableClear?: boolean
  /** Disable apply button */
  disableApply?: boolean
  /** Loading state for apply button */
  applyLoading?: boolean
  /** Loading state for clear button */
  clearLoading?: boolean
  /** Button size */
  buttonSize?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  /** Button variant */
  buttonVariant?: 'text' | 'flat' | 'elevated' | 'tonal' | 'outlined' | 'plain'
}

// =============================================================================
// EVENT INTERFACES
// =============================================================================

/**
 * BaseDataTable events
 */
export interface BaseDataTableEvents {
  /** Apply filters event */
  'applyFilters': []
  /** Clear filters event */
  'clearFilters': []
  /** Row click event */
  'click:row': [{ event: Event; item: DataTableItem }]
  /** Sort change event */
  'update:sortBy': [SortOption[]]
  /** Page change event */
  'update:page': [number]
  /** Items per page change event */
  'update:itemsPerPage': [number]
  /** Selection change event */
  'update:selected': [DataTableItem[]]
  /** Expand/collapse event */
  'update:expanded': [string[]]
}

/**
 * SearchFilter events
 */
export interface SearchFilterEvents {
  /** Value update event */
  'update:modelValue': [value: string]
  /** Input event (before debounce) */
  'input': [value: string]
  /** Clear event */
  'clear': []
  /** Focus event */
  'focus': [event: FocusEvent]
  /** Blur event */
  'blur': [event: FocusEvent]
}

/**
 * FilterActions events
 */
export interface FilterActionsEvents {
  /** Clear filters event */
  'clear': []
  /** Apply filters event */
  'apply': []
}

// =============================================================================
// SLOT INTERFACES
// =============================================================================

/**
 * BaseDataTable slot props
 */
export interface BaseDataTableSlots {
  /** Custom filters slot */
  filters: never
  /** Header slot for specific column */
  [key: `header.${string}`]: { column: DataTableHeader; header: DataTableHeader }
  /** Item slot for specific column */
  [key: `item.${string}`]: { item: DataTableItem; value: unknown; column: DataTableHeader }
  /** Expanded row content */
  'expanded-row': { item: DataTableItem; columns: DataTableHeader[] }
  /** Loading state */
  loading: never
  /** No data state */
  'no-data': never
  /** Top toolbar */
  top: never
  /** Bottom toolbar */
  bottom: never
  /** Footer */
  footer: { props: Record<string, unknown> }
  /** Body prepend */
  'body.prepend': { headers: DataTableHeader[] }
  /** Body append */
  'body.append': { headers: DataTableHeader[] }
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract item type from headers configuration
 */
export type ExtractItemType<T extends readonly DataTableHeader[]> = {
  [K in T[number]['key']]: unknown
}

/**
 * Nested object path type for dot notation support
 */
export type NestedPath<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${NestedPath<T[K]>}`
          : `${K}`
        : never
    }[keyof T]
  : never

/**
 * Get nested value type by path
 */
export type NestedValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? NestedValue<T[K], Rest>
    : unknown
  : P extends keyof T
  ? T[P]
  : unknown

// =============================================================================
// COMPOSABLE RETURN TYPES
// =============================================================================

/**
 * Data table composable return type
 */
export interface UseDataTable<T extends DataTableItem = DataTableItem> {
  /** Current items */
  items: Readonly<Ref<T[]>>
  /** Filtered items */
  filteredItems: ComputedRef<T[]>
  /** Paginated items */
  paginatedItems: ComputedRef<T[]>
  /** Current page */
  currentPage: Ref<number>
  /** Items per page */
  itemsPerPage: Ref<number>
  /** Total items count */
  totalItems: ComputedRef<number>
  /** Total pages count */
  totalPages: ComputedRef<number>
  /** Current sort configuration */
  sortBy: Ref<SortOption[]>
  /** Selected items */
  selected: Ref<T[]>
  /** Expanded items */
  expanded: Ref<string[]>
  /** Loading state */
  loading: Ref<boolean>
  /** Go to specific page */
  goToPage: (page: number) => void
  /** Go to next page */
  nextPage: () => void
  /** Go to previous page */
  previousPage: () => void
  /** Update sort */
  updateSort: (sortOptions: SortOption[]) => void
  /** Toggle item selection */
  toggleSelect: (item: T) => void
  /** Select all items */
  selectAll: () => void
  /** Clear all selections */
  clearSelection: () => void
  /** Toggle item expansion */
  toggleExpand: (item: T) => void
  /** Expand all items */
  expandAll: () => void
  /** Collapse all items */
  collapseAll: () => void
  /** Refresh data */
  refresh: () => Promise<void>
}