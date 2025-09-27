<template>
  <v-text-field
    :model-value="displayValue"
    :prepend-inner-icon="prependInnerIcon"
    :prepend-icon="prependIcon"
    :append-icon="appendIcon"
    :append-inner-icon="appendInnerIcon"
    :variant="variant"
    :density="density"
    :placeholder="placeholder"
    :hide-details="hideDetails"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading || isSearching"
    :aria-label="ariaLabel"
    :class="inputClass"
    role="searchbox"
    @update:model-value="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
    @clear="handleClear"
    @keydown.enter="handleEnter"
    @keydown.escape="handleEscape"
  >
    <!-- Prepend slot passthrough -->
    <template v-if="$slots.prepend" #prepend="slotProps">
      <slot name="prepend" v-bind="slotProps" />
    </template>

    <!-- Prepend inner slot passthrough -->
    <template v-if="$slots['prepend-inner']" #prepend-inner="slotProps">
      <slot name="prepend-inner" v-bind="slotProps" />
    </template>

    <!-- Append slot passthrough -->
    <template v-if="$slots.append" #append="slotProps">
      <slot name="append" v-bind="slotProps" />
    </template>

    <!-- Append inner slot with search indicator -->
    <template #append-inner="slotProps">
      <slot name="append-inner" v-bind="slotProps">
        <v-icon
          v-if="showSearchIndicator && hasSearchValue"
          :color="searchIndicatorColor"
          size="small"
          class="search-indicator"
        >
          mdi-magnify
        </v-icon>
      </slot>
    </template>

    <!-- Details slot for error messages -->
    <template v-if="$slots.details" #details="slotProps">
      <slot name="details" v-bind="slotProps" />
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount, readonly } from 'vue'
import type { SearchFilterProps, SearchFilterEvents } from '~/types/data-table'

// =============================================================================
// PROPS & EMITS
// =============================================================================

interface Props extends SearchFilterProps {
  /** Custom input class */
  inputClass?: string
  /** Show search indicator icon */
  showSearchIndicator?: boolean
  /** Search indicator color */
  searchIndicatorColor?: string
  /** Auto-focus on mount */
  autoFocus?: boolean
  /** Minimum characters before triggering search */
  minLength?: number
  /** Show loading indicator during debounce */
  showLoadingIndicator?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'ค้นหา...',
  ariaLabel: 'ค้นหา',
  disabled: false,
  clearable: true,
  loading: false,
  prependIcon: '',
  prependInnerIcon: 'mdi-magnify',
  appendIcon: '',
  appendInnerIcon: '',
  variant: 'outlined',
  density: 'compact',
  hideDetails: true,
  debounce: 300,
  inputClass: '',
  showSearchIndicator: false,
  searchIndicatorColor: 'primary',
  autoFocus: false,
  minLength: 0,
  showLoadingIndicator: true
})

const emit = defineEmits<SearchFilterEvents>()

// =============================================================================
// REACTIVE STATE
// =============================================================================

/**
 * Internal value for immediate display
 */
const internalValue = ref(props.modelValue)

/**
 * Debounced search timer
 */
let debounceTimer: NodeJS.Timeout | null = null

/**
 * Is currently searching (debouncing)
 */
const isSearching = ref(false)

/**
 * Focus state for accessibility
 */
const isFocused = ref(false)

// =============================================================================
// COMPUTED PROPERTIES
// =============================================================================

/**
 * Display value for the input field
 */
const displayValue = computed({
  get: () => internalValue.value,
  set: (value: string) => {
    internalValue.value = value
  }
})

/**
 * Whether the search has a value
 */
const hasSearchValue = computed(() => {
  return internalValue.value && internalValue.value.trim().length > 0
})

/**
 * Whether search should be triggered based on minimum length
 */
const shouldTriggerSearch = computed(() => {
  return !props.minLength || internalValue.value.length >= props.minLength
})

// =============================================================================
// WATCHERS
// =============================================================================

/**
 * Watch for external model value changes
 */
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== internalValue.value) {
      internalValue.value = newValue
    }
  },
  { immediate: true }
)

// =============================================================================
// METHODS
// =============================================================================

/**
 * Clear the debounce timer
 */
const clearDebounceTimer = (): void => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

/**
 * Handle input changes with debouncing
 */
const handleInput = (value: string): void => {
  internalValue.value = value

  // Emit immediate input event
  emit('input', value)

  // Clear existing timer
  clearDebounceTimer()

  // Show loading if configured
  if (props.showLoadingIndicator && props.debounce > 0) {
    isSearching.value = true
  }

  // Handle debouncing
  if (props.debounce > 0) {
    debounceTimer = setTimeout(() => {
      isSearching.value = false

      // Only emit if value meets minimum length requirement
      if (shouldTriggerSearch.value) {
        emit('update:modelValue', value)
      } else if (value.length === 0) {
        // Always emit empty values immediately
        emit('update:modelValue', value)
      }
    }, props.debounce)
  } else {
    // Immediate update without debouncing
    if (shouldTriggerSearch.value || value.length === 0) {
      emit('update:modelValue', value)
    }
  }
}

/**
 * Handle clear action
 */
const handleClear = (): void => {
  clearDebounceTimer()
  isSearching.value = false
  internalValue.value = ''
  emit('update:modelValue', '')
  emit('clear')
}

/**
 * Handle focus events
 */
const handleFocus = (event: FocusEvent): void => {
  isFocused.value = true
  emit('focus', event)
}

/**
 * Handle blur events
 */
const handleBlur = (event: FocusEvent): void => {
  isFocused.value = false
  emit('blur', event)
}

/**
 * Handle Enter key press
 */
const handleEnter = (): void => {
  clearDebounceTimer()
  isSearching.value = false

  // Force immediate search on Enter
  if (shouldTriggerSearch.value || internalValue.value.length === 0) {
    emit('update:modelValue', internalValue.value)
  }
}

/**
 * Handle Escape key press
 */
const handleEscape = (): void => {
  if (hasSearchValue.value) {
    handleClear()
  }
}

/**
 * Public method to focus the input
 */
const focus = (): void => {
  nextTick(() => {
    const input = document.querySelector('[role="searchbox"]') as HTMLInputElement
    input?.focus()
  })
}

/**
 * Public method to blur the input
 */
const blur = (): void => {
  nextTick(() => {
    const input = document.querySelector('[role="searchbox"]') as HTMLInputElement
    input?.blur()
  })
}

// =============================================================================
// LIFECYCLE
// =============================================================================

/**
 * Auto-focus if configured
 */
if (props.autoFocus) {
  nextTick(() => {
    focus()
  })
}

/**
 * Cleanup on unmount
 */
onBeforeUnmount(() => {
  clearDebounceTimer()
})

// =============================================================================
// EXPOSE PUBLIC API
// =============================================================================

defineExpose({
  focus,
  blur,
  clear: handleClear,
  hasValue: hasSearchValue,
  isSearching: readonly(isSearching),
  isFocused: readonly(isFocused)
})
</script>

<style scoped>
/* =============================================================================
   ENHANCED SEARCH FILTER STYLES
   ============================================================================= */

/* Search indicator animation */
.search-indicator {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Enhanced focus states */
:deep(.v-field--focused) {
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.2);
}

/* Loading state styles */
:deep(.v-field--loading .v-field__loader) {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(var(--v-theme-primary), 0.4) 50%,
    transparent 100%
  );
  animation: loading-sweep 1.5s ease-in-out infinite;
}

@keyframes loading-sweep {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Improved accessibility */
:deep(.v-field__input) {
  caret-color: rgba(var(--v-theme-primary), 1);
}

:deep(.v-field__input::placeholder) {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-style: italic;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :deep(.v-field--focused) {
    box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.8);
    border: 2px solid rgba(var(--v-theme-primary), 1);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .search-indicator {
    animation: none;
  }

  :deep(.v-field--loading .v-field__loader) {
    animation: none;
  }
}

/* Mobile optimizations */
@media (max-width: 600px) {
  :deep(.v-field__input) {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}

/* Dark theme optimizations */
.v-theme--dark {
  :deep(.v-field__input::placeholder) {
    color: rgba(var(--v-theme-on-surface), 0.5);
  }
}
</style>