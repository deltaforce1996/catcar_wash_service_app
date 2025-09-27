<template>
  <v-card elevation="2" rounded="lg" :class="cardClass">
    <!-- Card Title -->
    <v-card-title class="pa-6">
      <div class="d-flex justify-space-between align-center">
        <h2 class="text-h5 font-weight-bold">{{ title }}</h2>
        <v-chip variant="tonal" color="primary">
          {{ itemCount }} รายการ
        </v-chip>
      </div>
    </v-card-title>

    <!-- Filter Section -->
    <v-card-text v-if="showFilters" class="pb-2">
      <!-- Custom filters slot -->
      <slot name="filters" />

      <!-- Filter Change Alert -->
      <v-alert
        v-if="hasFilterChanges"
        border
        density="compact"
        type="warning"
        variant="tonal"
        class="my-2"
      >
        <template #prepend>
          <v-icon>mdi-information</v-icon>
        </template>
        <strong>เตือน:</strong> คุณได้เปลี่ยนแปลงตัวกรองแล้ว กรุณากดปุ่ม
        "ยืนยันตัวกรอง" เพื่อใช้งานตัวกรองใหม่
      </v-alert>

      <!-- Filter Actions -->
      <v-row v-if="showFilterActions" class="mb-2">
        <v-col cols="12" class="d-flex justify-end ga-2">
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-refresh"
            @click="handleClearFilters"
          >
            ล้างตัวกรอง
          </v-btn>
          <v-btn
            color="primary"
            size="small"
            prepend-icon="mdi-check"
            @click="handleApplyFilters"
          >
            ยืนยันตัวกรอง
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Data Table -->
    <v-data-table
      :headers="headers"
      :items="items"
      :loading="loading"
      :items-per-page="itemsPerPage"
      class="elevation-0"
      hover
      :show-expand="showExpand"
      :expand-on-click="expandOnClick"
      v-bind="$attrs"
    >
      <!-- Custom column slots -->
      <template
        v-for="header in headers"
        :key="`item.${header.key}`"
        #[`item.${header.key}`]="{ item }"
      >
        <slot :name="`item.${header.key}`" :item="item">
          <!-- Default rendering for non-custom columns -->
          {{ getNestedValue(item, header.key) }}
        </slot>
      </template>

      <!-- Expandable row content -->
      <template v-if="showExpand" #expanded-row="{ columns, item }">
        <td :colspan="columns.length" class="pa-0">
          <slot name="expanded-row" :item="item" :columns="columns" />
        </td>
      </template>

      <!-- Custom table slots passthrough -->
      <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
        <slot v-if="!isCustomSlot(name)" :name="name" v-bind="slotData" />
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
interface Header {
  title: string;
  key: string;
  sortable?: boolean;
  [key: string]: unknown;
}

interface Props {
  title: string;
  headers: Header[];
  items: Record<string, unknown>[];
  loading?: boolean;
  itemsPerPage?: number;
  showFilters?: boolean;
  showFilterActions?: boolean;
  hasFilterChanges?: boolean;
  showExpand?: boolean;
  expandOnClick?: boolean;
  cardClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  itemsPerPage: 10,
  showFilters: true,
  showFilterActions: true,
  hasFilterChanges: false,
  showExpand: true,
  expandOnClick: true,
  cardClass: '',
});

const emit = defineEmits<{
  applyFilters: [];
  clearFilters: [];
}>();

// Computed
const itemCount = computed(() => props.items.length);

// Methods
const handleApplyFilters = () => {
  emit('applyFilters');
};

const handleClearFilters = () => {
  emit('clearFilters');
};

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const isCustomSlot = (name: string): boolean => {
  return [
    'filters',
    'expanded-row',
    ...props.headers.map(h => `item.${h.key}`)
  ].includes(name);
};
</script>

<style scoped>
/* Enhanced visual hierarchy */
:deep(.v-card-title) {
  font-size: 1.125rem !important;
  font-weight: 600 !important;
  letter-spacing: -0.025em !important;
  padding: 20px 24px 8px 24px !important;
}

/* Expand/collapse animation */
:deep(.v-data-table__expanded-row) {
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

/* Mobile responsiveness */
@media (max-width: 960px) {
  :deep(.v-card-title) {
    font-size: 1rem !important;
    padding: 16px 20px 8px 20px !important;
  }
}

@media (max-width: 600px) {
  :deep(.v-card-title) {
    font-size: 0.875rem !important;
    padding: 12px 16px 6px 16px !important;
  }
}
</style>