<template>
  <v-row :class="containerClass">
    <v-col cols="12" class="d-flex justify-end ga-2 flex-wrap">
      <!-- Clear Button -->
      <v-btn
        :variant="clearButtonVariant"
        :size="buttonSize"
        :disabled="disableClear"
        :loading="clearLoading"
        :prepend-icon="clearIcon"
        :color="clearColor"
        :class="clearButtonClass"
        @click="handleClear"
      >
        <template v-if="$slots['clear-content']" #default>
          <slot name="clear-content" />
        </template>
        <template v-else>
          {{ clearText }}
        </template>

        <!-- Custom prepend icon slot -->
        <template v-if="$slots['clear-prepend']" #prepend>
          <slot name="clear-prepend" />
        </template>

        <!-- Custom append icon slot -->
        <template v-if="$slots['clear-append']" #append>
          <slot name="clear-append" />
        </template>
      </v-btn>

      <!-- Apply Button -->
      <v-btn
        :variant="applyButtonVariant"
        :size="buttonSize"
        :disabled="disableApply"
        :loading="applyLoading"
        :prepend-icon="applyIcon"
        :color="applyColor"
        :class="applyButtonClass"
        @click="handleApply"
      >
        <template v-if="$slots['apply-content']" #default>
          <slot name="apply-content" />
        </template>
        <template v-else>
          {{ applyText }}
        </template>

        <!-- Custom prepend icon slot -->
        <template v-if="$slots['apply-prepend']" #prepend>
          <slot name="apply-prepend" />
        </template>

        <!-- Custom append icon slot -->
        <template v-if="$slots['apply-append']" #append>
          <slot name="apply-append" />
        </template>
      </v-btn>

      <!-- Additional actions slot -->
      <slot name="additional-actions" :clear="handleClear" :apply="handleApply" />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FilterActionsProps, FilterActionsEvents } from '~/types/data-table'

// =============================================================================
// PROPS & EMITS
// =============================================================================

interface Props extends FilterActionsProps {
  /** Clear button variant override */
  clearButtonVariant?: 'text' | 'flat' | 'elevated' | 'tonal' | 'outlined' | 'plain'
  /** Apply button variant override */
  applyButtonVariant?: 'text' | 'flat' | 'elevated' | 'tonal' | 'outlined' | 'plain'
  /** Clear button color */
  clearColor?: string
  /** Apply button color */
  applyColor?: string
  /** Clear button icon */
  clearIcon?: string
  /** Apply button icon */
  applyIcon?: string
  /** Clear button CSS class */
  clearButtonClass?: string
  /** Apply button CSS class */
  applyButtonClass?: string
  /** Layout direction */
  direction?: 'row' | 'column'
  /** Button spacing */
  spacing?: number
  /** Full width buttons */
  fullWidth?: boolean
  /** Show tooltips */
  showTooltips?: boolean
  /** Clear button tooltip */
  clearTooltip?: string
  /** Apply button tooltip */
  applyTooltip?: string
}

const props = withDefaults(defineProps<Props>(), {
  clearText: 'ล้างตัวกรอง',
  applyText: 'ยืนยันตัวกรอง',
  containerClass: 'mb-2',
  disableClear: false,
  disableApply: false,
  applyLoading: false,
  clearLoading: false,
  buttonSize: 'small',
  buttonVariant: 'outlined',
  clearButtonVariant: undefined, // Will use buttonVariant
  applyButtonVariant: undefined, // Will use buttonVariant
  clearColor: '',
  applyColor: 'primary',
  clearIcon: 'mdi-refresh',
  applyIcon: 'mdi-check',
  clearButtonClass: '',
  applyButtonClass: '',
  direction: 'row',
  spacing: 2,
  fullWidth: false,
  showTooltips: false,
  clearTooltip: 'ล้างตัวกรองทั้งหมด',
  applyTooltip: 'ใช้ตัวกรองที่เลือก'
})

const emit = defineEmits<FilterActionsEvents>()

// =============================================================================
// COMPUTED PROPERTIES
// =============================================================================

/**
 * Get the effective clear button variant
 */
const clearButtonVariant = computed(() => {
  return props.clearButtonVariant || props.buttonVariant
})

/**
 * Get the effective apply button variant
 */
const applyButtonVariant = computed(() => {
  return props.applyButtonVariant ||
         (props.buttonVariant === 'outlined' ? 'elevated' : props.buttonVariant)
})

/**
 * Get container classes with dynamic spacing and direction
 */
const containerClass = computed(() => {
  const classes = [props.containerClass]

  if (props.direction === 'column') {
    classes.push('flex-column')
  }

  return classes.filter(Boolean).join(' ')
})

/**
 * Get button group classes
 */
const buttonGroupClasses = computed(() => {
  const classes = ['d-flex', 'align-center']

  if (props.direction === 'row') {
    classes.push('justify-end', `ga-${props.spacing}`, 'flex-wrap')
  } else {
    classes.push('flex-column', `ga-${props.spacing}`)
  }

  if (props.fullWidth) {
    classes.push('w-100')
  }

  return classes.join(' ')
})

/**
 * Get clear button classes
 */
const clearButtonClasses = computed(() => {
  const classes = [props.clearButtonClass]

  if (props.fullWidth) {
    classes.push('w-100')
  }

  return classes.filter(Boolean).join(' ')
})

/**
 * Get apply button classes
 */
const applyButtonClasses = computed(() => {
  const classes = [props.applyButtonClass]

  if (props.fullWidth) {
    classes.push('w-100')
  }

  return classes.filter(Boolean).join(' ')
})

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle clear action with enhanced feedback
 */
const handleClear = (): void => {
  if (props.disableClear || props.clearLoading) return

  emit('clear')

  // Optional haptic feedback for mobile devices
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

/**
 * Handle apply action with enhanced feedback
 */
const handleApply = (): void => {
  if (props.disableApply || props.applyLoading) return

  emit('apply')

  // Optional haptic feedback for mobile devices
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 50, 50])
  }
}

// =============================================================================
// ACCESSIBILITY HELPERS
// =============================================================================

/**
 * Get ARIA label for clear button
 */
const clearAriaLabel = computed(() => {
  if (props.showTooltips && props.clearTooltip) {
    return props.clearTooltip
  }
  return `${props.clearText} (${props.disableClear ? 'ปิดใช้งาน' : 'ใช้งานได้'})`
})

/**
 * Get ARIA label for apply button
 */
const applyAriaLabel = computed(() => {
  if (props.showTooltips && props.applyTooltip) {
    return props.applyTooltip
  }
  return `${props.applyText} (${props.disableApply ? 'ปิดใช้งาน' : 'ใช้งานได้'})`
})

// =============================================================================
// EXPOSE PUBLIC API
// =============================================================================

defineExpose({
  clear: handleClear,
  apply: handleApply,
  isDisabled: computed(() => props.disableClear && props.disableApply),
  isLoading: computed(() => props.clearLoading || props.applyLoading)
})
</script>

<style scoped>
/* =============================================================================
   ENHANCED FILTER ACTIONS STYLES
   ============================================================================= */

/* Button group transitions */
.v-row {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced button focus states */
:deep(.v-btn--variant-outlined:focus-visible) {
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.2);
}

:deep(.v-btn--variant-elevated:focus-visible) {
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.3),
              0 0 0 2px rgba(var(--v-theme-primary), 0.2);
}

/* Loading state enhancements */
:deep(.v-btn--loading) {
  pointer-events: none;
}

:deep(.v-btn--loading .v-btn__content) {
  opacity: 0.6;
}

/* Disabled state styling */
:deep(.v-btn--disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Button hover effects */
:deep(.v-btn:not(.v-btn--disabled):hover) {
  transform: translateY(-1px);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Active state feedback */
:deep(.v-btn:not(.v-btn--disabled):active) {
  transform: translateY(0);
  transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Full width button styling */
.w-100 :deep(.v-btn) {
  justify-content: center;
}

/* Column layout spacing */
.flex-column .v-btn {
  margin-bottom: 0.5rem;
}

.flex-column .v-btn:last-child {
  margin-bottom: 0;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  :deep(.v-btn) {
    min-width: 80px;
    font-size: 0.875rem;
  }

  /* Stack buttons on small screens if needed */
  .mobile-stack {
    flex-direction: column !important;
    align-items: stretch !important;
  }

  .mobile-stack .v-btn {
    margin-bottom: 0.5rem;
    width: 100%;
  }

  .mobile-stack .v-btn:last-child {
    margin-bottom: 0;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :deep(.v-btn--variant-outlined) {
    border-width: 2px;
  }

  :deep(.v-btn--variant-elevated) {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  :deep(.v-btn) {
    transition: none !important;
  }

  :deep(.v-btn:hover) {
    transform: none !important;
  }
}

/* Print styles */
@media print {
  .v-row {
    display: none !important;
  }
}

/* Dark theme optimizations */
.v-theme--dark {
  :deep(.v-btn--variant-outlined) {
    border-color: rgba(var(--v-border-color), 0.3);
  }
}
</style>