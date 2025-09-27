/**
 * Advanced filter management composable for Vue 3 + TypeScript
 * Provides reusable, type-safe filter functionality with optimal reactivity
 */

import { ref, computed, shallowReactive, shallowRef, toRefs, type Ref, type ComputedRef } from 'vue'
import type { FilterValue, FilterField, FilterManager } from '~/types/data-table'

/**
 * Configuration for filter field creation
 */
interface FilterFieldConfig<T = FilterValue> {
  type: FilterField<T>['type']
  label?: string
  placeholder?: string
  options?: readonly unknown[]
  rules?: Array<(value: T) => boolean | string>
  defaultValue?: T
  immediate?: boolean
}

/**
 * Creates a comprehensive filter management system
 *
 * @example
 * ```typescript
 * const {
 *   registerField,
 *   values,
 *   hasChanges,
 *   applyFilters,
 *   clearAllFilters
 * } = useFilterManager<{
 *   search: string
 *   status: string[]
 *   dateRange: [string, string] | null
 * }>()
 *
 * // Register filter fields
 * registerField('search', {
 *   type: 'text',
 *   placeholder: 'ค้นหา...',
 *   defaultValue: ''
 * })
 *
 * registerField('status', {
 *   type: 'multiselect',
 *   label: 'สถานะ',
 *   options: ['ACTIVE', 'INACTIVE'],
 *   defaultValue: []
 * })
 * ```
 */
export function useFilterManager<
  T extends Record<string, FilterValue> = Record<string, FilterValue>
>(): FilterManager<T> {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  /**
   * Registry of all filter fields using shallowReactive for performance
   * Only the first level is reactive, deep objects are not tracked
   */
  const fieldsRegistry = shallowReactive<Record<string, FilterField<any>>>({})

  /**
   * Current filter values using shallowRef for optimal performance
   */
  const filterValues = shallowRef<T>({} as T)

  /**
   * Temporary filter values for pending changes
   */
  const tempFilterValues = ref<T>({} as T)

  // ==========================================================================
  // COMPUTED PROPERTIES
  // ==========================================================================

  /**
   * Readonly access to filter fields
   */
  const fields = computed(() => fieldsRegistry as Readonly<Record<keyof T, FilterField>>)

  /**
   * Readonly access to current filter values
   */
  const values = computed(() => filterValues.value as Readonly<T>)

  /**
   * Check if any filter has pending changes
   * Uses JSON comparison for deep equality check
   */
  const hasChanges = computed(() => {
    const currentKeys = Object.keys(filterValues.value)
    const tempKeys = Object.keys(tempFilterValues.value)

    // Check if number of keys changed
    if (currentKeys.length !== tempKeys.length) return true

    // Check each field for changes
    return currentKeys.some(key => {
      const current = filterValues.value[key as keyof T]
      const temp = tempFilterValues.value[key as keyof T]

      // Handle array comparison
      if (Array.isArray(current) && Array.isArray(temp)) {
        return JSON.stringify([...current].sort()) !== JSON.stringify([...temp].sort())
      }

      // Handle object comparison
      if (current && typeof current === 'object' && temp && typeof temp === 'object') {
        return JSON.stringify(current) !== JSON.stringify(temp)
      }

      // Handle primitive comparison
      return current !== temp
    })
  })

  /**
   * Check if any filters are currently active
   */
  const hasActiveFilters = computed(() => {
    return Object.values(fieldsRegistry).some(field => field.isActive.value)
  })

  /**
   * Count of active filters
   */
  const activeFilterCount = computed(() => {
    return Object.values(fieldsRegistry).reduce((count, field) => {
      return field.isActive.value ? count + 1 : count
    }, 0)
  })

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  /**
   * Check if a value is considered "empty" for filter purposes
   */
  const isEmptyValue = (value: FilterValue): boolean => {
    if (value === null || value === undefined || value === '') return true
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value as object).length === 0
    return false
  }

  /**
   * Deep clone a value to prevent reference sharing
   */
  const deepClone = <V>(value: V): V => {
    if (value === null || typeof value !== 'object') return value
    if (Array.isArray(value)) return [...value] as V
    return { ...value } as V
  }

  /**
   * Create a filter field with reactive properties
   */
  const createFilterField = <V extends FilterValue>(
    key: string,
    config: FilterFieldConfig<V>
  ): FilterField<V> => {
    const fieldValue = ref(config.defaultValue ?? null) as Ref<V>
    const fieldTempValue = ref(config.defaultValue ?? null) as Ref<V>

    const field: FilterField<V> = {
      key,
      value: fieldValue,
      tempValue: fieldTempValue,
      type: config.type,
      label: config.label,
      placeholder: config.placeholder,
      options: config.options,
      rules: config.rules,

      // Computed: Check if field is active (has non-empty value)
      isActive: computed(() => !isEmptyValue(fieldValue.value)),

      // Clear the filter field
      clear: () => {
        const defaultVal = config.defaultValue ?? (
          config.type === 'multiselect' ? [] :
          config.type === 'number' ? 0 :
          config.type === 'boolean' ? false :
          null
        ) as V

        fieldValue.value = defaultVal
        fieldTempValue.value = defaultVal

        // Update global filter values
        updateGlobalValues()
      },

      // Apply temporary value to actual value
      apply: () => {
        fieldValue.value = deepClone(fieldTempValue.value)
        updateGlobalValues()
      },

      // Reset temporary value to current value
      reset: () => {
        fieldTempValue.value = deepClone(fieldValue.value)
        updateGlobalTempValues()
      }
    }

    return field
  }

  /**
   * Update global filter values from individual fields
   */
  const updateGlobalValues = () => {
    const newValues = {} as T
    Object.keys(fieldsRegistry).forEach(key => {
      newValues[key as keyof T] = fieldsRegistry[key].value.value
    })
    filterValues.value = newValues
  }

  /**
   * Update global temp values from individual fields
   */
  const updateGlobalTempValues = () => {
    const newTempValues = {} as T
    Object.keys(fieldsRegistry).forEach(key => {
      newTempValues[key as keyof T] = fieldsRegistry[key].tempValue.value
    })
    tempFilterValues.value = newTempValues
  }

  // ==========================================================================
  // PUBLIC METHODS
  // ==========================================================================

  /**
   * Register a new filter field
   */
  const registerField = <K extends keyof T>(
    key: K,
    config: FilterFieldConfig<T[K]>
  ): void => {
    const field = createFilterField(key as string, config)
    fieldsRegistry[key as string] = field

    // Initialize global values
    updateGlobalValues()
    updateGlobalTempValues()

    // Apply immediately if specified
    if (config.immediate && !isEmptyValue(config.defaultValue)) {
      field.apply()
    }
  }

  /**
   * Unregister a filter field
   */
  const unregisterField = (key: keyof T): void => {
    delete fieldsRegistry[key as string]

    // Update global values
    updateGlobalValues()
    updateGlobalTempValues()
  }

  /**
   * Apply all pending filter changes
   */
  const applyFilters = (): void => {
    Object.values(fieldsRegistry).forEach(field => {
      field.apply()
    })
  }

  /**
   * Clear all filters
   */
  const clearAllFilters = (): void => {
    Object.values(fieldsRegistry).forEach(field => {
      field.clear()
    })
  }

  /**
   * Reset all temporary values to current values
   */
  const resetTempValues = (): void => {
    Object.values(fieldsRegistry).forEach(field => {
      field.reset()
    })
  }

  /**
   * Get a specific filter field
   */
  const getField = <K extends keyof T>(key: K): FilterField<T[K]> | undefined => {
    return fieldsRegistry[key as string] as FilterField<T[K]> | undefined
  }

  /**
   * Update a specific filter value
   */
  const updateFieldValue = <K extends keyof T>(key: K, value: T[K]): void => {
    const field = getField(key)
    if (field) {
      field.value.value = value
      updateGlobalValues()
    }
  }

  /**
   * Update a specific filter temp value
   */
  const updateFieldTempValue = <K extends keyof T>(key: K, value: T[K]): void => {
    const field = getField(key)
    if (field) {
      field.tempValue.value = value
      updateGlobalTempValues()
    }
  }

  /**
   * Batch update multiple filter values
   */
  const batchUpdateValues = (updates: Partial<T>): void => {
    Object.entries(updates).forEach(([key, value]) => {
      updateFieldValue(key as keyof T, value as T[keyof T])
    })
  }

  /**
   * Get filter summary for debugging/logging
   */
  const getFilterSummary = () => {
    return {
      totalFields: Object.keys(fieldsRegistry).length,
      activeFields: activeFilterCount.value,
      hasChanges: hasChanges.value,
      fieldSummary: Object.entries(fieldsRegistry).map(([key, field]) => ({
        key,
        type: field.type,
        isActive: field.isActive.value,
        hasValue: !isEmptyValue(field.value.value),
        currentValue: field.value.value,
        tempValue: field.tempValue.value,
      }))
    }
  }

  // ==========================================================================
  // RETURN INTERFACE
  // ==========================================================================

  return {
    // State
    fields,
    values,
    tempValues: tempFilterValues,

    // Computed
    hasChanges,
    hasActiveFilters,
    activeFilterCount,

    // Methods
    applyFilters,
    clearAllFilters,
    resetTempValues,
    registerField,
    unregisterField,

    // Advanced methods
    getField,
    updateFieldValue,
    updateFieldTempValue,
    batchUpdateValues,
    getFilterSummary,
  }
}

/**
 * Specialized hook for search functionality with debouncing
 */
export function useSearchFilter(options: {
  debounce?: number
  immediate?: boolean
  placeholder?: string
} = {}) {
  const { debounce = 300, immediate = false, placeholder = 'ค้นหา...' } = options

  const searchValue = ref('')
  const debouncedSearchValue = ref('')
  const isSearching = ref(false)

  let debounceTimer: NodeJS.Timeout | null = null

  /**
   * Update search value with debouncing
   */
  const updateSearch = (value: string) => {
    searchValue.value = value
    isSearching.value = true

    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      debouncedSearchValue.value = value
      isSearching.value = false
    }, debounce)
  }

  /**
   * Clear search immediately
   */
  const clearSearch = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    searchValue.value = ''
    debouncedSearchValue.value = ''
    isSearching.value = false
  }

  /**
   * Whether search is active
   */
  const hasSearchValue = computed(() => debouncedSearchValue.value.trim() !== '')

  // Initialize
  if (immediate) {
    debouncedSearchValue.value = searchValue.value
  }

  return {
    searchValue,
    debouncedSearchValue,
    isSearching,
    hasSearchValue,
    updateSearch,
    clearSearch,
    placeholder
  }
}

/**
 * Specialized hook for time range filtering
 */
export function useTimeRangeFilter() {
  const startTime = ref<string | null>(null)
  const endTime = ref<string | null>(null)
  const tempStartTime = ref<string | null>(null)
  const tempEndTime = ref<string | null>(null)

  /**
   * Format time object to HH:mm string
   */
  const formatTimeToString = (timeObj: any): string => {
    if (!timeObj) return ''

    if (typeof timeObj === 'string') return timeObj

    if (timeObj instanceof Date) {
      return timeObj.toTimeString().slice(0, 5)
    }

    if (timeObj && typeof timeObj === 'object') {
      const hour = timeObj.hour || timeObj.hours || 0
      const minute = timeObj.minute || timeObj.minutes || 0
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    }

    return ''
  }

  /**
   * Whether time range is active
   */
  const hasTimeRange = computed(() =>
    Boolean(startTime.value) || Boolean(endTime.value)
  )

  /**
   * Whether temp values differ from actual values
   */
  const hasTimeChanges = computed(() =>
    tempStartTime.value !== startTime.value || tempEndTime.value !== endTime.value
  )

  /**
   * Apply temp time values
   */
  const applyTimeRange = () => {
    startTime.value = tempStartTime.value
    endTime.value = tempEndTime.value
  }

  /**
   * Clear time range
   */
  const clearTimeRange = () => {
    startTime.value = null
    endTime.value = null
    tempStartTime.value = null
    tempEndTime.value = null
  }

  /**
   * Reset temp values
   */
  const resetTempTimeRange = () => {
    tempStartTime.value = startTime.value
    tempEndTime.value = endTime.value
  }

  /**
   * Filter items by time range
   */
  const filterByTimeRange = <T extends { created_at: string }>(items: T[]): T[] => {
    if (!hasTimeRange.value) return items

    return items.filter(item => {
      const itemDate = new Date(item.created_at)
      const itemTime = formatTimeToString(itemDate)

      const startStr = startTime.value
      const endStr = endTime.value

      if (startStr && endStr) {
        return itemTime >= startStr && itemTime <= endStr
      } else if (startStr) {
        return itemTime >= startStr
      } else if (endStr) {
        return itemTime <= endStr
      }

      return true
    })
  }

  return {
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
  }
}