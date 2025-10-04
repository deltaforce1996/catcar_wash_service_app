<template>
  <v-card elevation="2" rounded="lg" :class="cardClass">
    <!-- Card Title -->
    <v-card-title class="pa-6">
      <div class="d-flex justify-space-between align-center">
        <h2 class="text-h5 font-weight-bold">{{ title }}</h2>
        <v-chip variant="tonal" color="primary">
          {{ displayItemCount }} รายการทั้งหมด
        </v-chip>
      </div>
    </v-card-title>

    <!-- Filter Section -->
    <v-card-text v-if="showFilters" class="pb-2">
      <!-- Custom filters slot -->
      <slot name="filters" />

      <!-- Filter Change Alert -->
      <v-alert
        v-if="hasFilterChanges && showFilterActions"
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

      <!-- Filter Actions Row (matching ex-user-mgmt.vue layout) -->
      <div v-if="showFilterActions" class="d-flex ga-2 mt-3">
        <v-btn
          color="primary"
          size="small"
          prepend-icon="mdi-check"
          @click="handleApplyFilters"
        >
          ยืนยันตัวกรอง
        </v-btn>
        <v-btn
          variant="outlined"
          size="small"
          prepend-icon="mdi-refresh"
          @click="handleClearFilters"
        >
          ล้างตัวกรอง
        </v-btn>
      </div>
    </v-card-text>

    <!-- Data Table -->
    <v-data-table
      :headers="headers"
      :items="items"
      :loading="loading"
      :items-per-page="computedItemsPerPage"
      :page="computedPage"
      :items-length="computedTotalItems"
      server-items-length
      :hide-default-footer="true"
      class="elevation-0"
      hover
      :show-expand="expandable"
      :expand-on-click="expandable"
      :show-select="selectable"
      :select-strategy="selectStrategy"
      v-bind="$attrs"
      @update:selected="handleSelectionUpdate"
    >
      <!-- Expandable row content (styled like ex-user-mgmt.vue) -->
      <template v-if="expandable" #expanded-row="{ columns, item }">
        <td :colspan="columns.length" class="pa-0">
          <v-card
            class="ma-2 enhanced-details-card"
            color="surface-container"
            elevation="1"
            rounded="lg"
          >
            <v-card-text class="pa-4">
              <div class="enhanced-breakdown">
                <slot name="expanded-row" :item="item" :columns="columns">
                  <!-- Default expanded content -->
                  <h3 class="text-subtitle-1 font-weight-bold mb-4">
                    รายละเอียด
                  </h3>
                  <div class="text-body-2 text-medium-emphasis">
                    ไม่มีเนื้อหาเพิ่มเติม
                  </div>
                </slot>
              </div>
            </v-card-text>
          </v-card>
        </td>
      </template>

      <!-- Actions column slot -->
      <template v-if="$slots.actions" #[`item.actions`]="{ item }">
        <slot name="actions" :item="item" />
      </template>

      <!-- Custom table slots passthrough -->
      <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
        <slot v-if="!isCustomSlot(name)" :name="name" v-bind="slotData" />
      </template>
    </v-data-table>

    <!-- Custom Pagination Controls (matching ex-user-mgmt.vue style) -->
    <v-card-actions class="pa-4">
      <div class="d-flex justify-space-between align-center w-100">
        <div class="text-body-2 text-medium-emphasis">
          แสดง {{ displayItemCount }} รายการทั้งหมด
        </div>
        <div class="d-flex align-center ga-2">
          <v-btn
            variant="outlined"
            size="small"
            :disabled="computedPage <= 1"
            @click="handlePreviousPage"
          >
            <v-icon>mdi-chevron-left</v-icon>
            ก่อนหน้า
          </v-btn>

          <div class="d-flex align-center ga-1">
            <span class="text-body-2">หน้า</span>
            <v-chip variant="tonal" color="primary" size="small">
              {{ computedPage }} / {{ computedTotalPages }}
            </v-chip>
          </div>

          <v-btn
            variant="outlined"
            size="small"
            :disabled="computedPage >= computedTotalPages"
            @click="handleNextPage"
          >
            ถัดไป
            <v-icon>mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </div>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
// TypeScript Interfaces
interface Header {
  title: string;
  key: string;
  sortable?: boolean;
  [key: string]: unknown;
}


interface Props {
  // Data
  title: string;
  items: Record<string, unknown>[];
  headers: Header[];
  loading?: boolean;

  // Filtering
  hasFilterChanges: boolean;
  showFilterActions?: boolean;
  showFilters?: boolean;

  // Server-side pagination
  itemsPerPage?: number;
  page?: number;
  totalItems: number;
  totalPages: number;

  // Features
  expandable?: boolean;
  selectable?: boolean;
  selectStrategy?: "single" | "page" | "all";

  // Styling
  cardClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showFilterActions: true,
  showFilters: true,
  itemsPerPage: 10,
  page: 1,
  expandable: true,
  selectable: false,
  selectStrategy: "page",
  cardClass: "",
});

// Events
interface Emits {
  "apply-filters": [];
  "clear-filters": [];
  "update:page": [page: number];
  "update:items-per-page": [limit: number];
  "update:selected": [items: Record<string, unknown>[]];
}

const emit = defineEmits<Emits>();

// Computed Properties
const displayItemCount = computed(() => props.totalItems);

const computedTotalItems = computed(() => props.totalItems);

const computedItemsPerPage = computed(() => props.itemsPerPage);

const computedPage = computed(() => props.page);

const computedTotalPages = computed(() => props.totalPages);

// Methods
const handleApplyFilters = () => {
  emit("apply-filters");
};

const handleClearFilters = () => {
  emit("clear-filters");
};

const handlePageUpdate = (newPage: number) => {
  emit("update:page", newPage);
};

const handleItemsPerPageUpdate = (newLimit: number) => {
  emit("update:items-per-page", newLimit);
};

const handleSelectionUpdate = (selectedItems: Record<string, unknown>[]) => {
  emit("update:selected", selectedItems);
};

const handlePreviousPage = () => {
  if (computedPage.value > 1) {
    emit("update:page", computedPage.value - 1);
  }
};

const handleNextPage = () => {
  if (computedPage.value < computedTotalPages.value) {
    emit("update:page", computedPage.value + 1);
  }
};

const isCustomSlot = (name: string): boolean => {
  return ["filters", "expanded-row", "actions"].includes(name);
};
</script>

<style scoped>
/* Enhanced Data Table Styles - Matching ex-user-mgmt.vue */

/* Enhanced details expandable row styles */
.enhanced-details-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(var(--v-theme-surface-container-low), 1);
}

.enhanced-breakdown {
  max-width: 100%;
}

/* Section styling for expandable content */
.enhanced-section {
  position: relative;
  min-height: 200px;
}

.enhanced-section:not(:last-child)::after {
  content: "";
  position: absolute;
  right: 0;
  top: 10%;
  bottom: 10%;
  width: 1px;
  background: rgba(var(--v-theme-outline), 0.2);
}

.enhanced-info-section,
.enhanced-content-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Card hover effects */
.enhanced-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  min-height: 60px;
}

.enhanced-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Expand/collapse animation matching ex-user-mgmt.vue */
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

/* Enhanced visual hierarchy */
:deep(.v-card-title) {
  font-size: 1.125rem !important;
  font-weight: 600 !important;
  letter-spacing: -0.025em !important;
  padding: 20px 24px 8px 24px !important;
}

.enhanced-details-card :deep(.v-card-text) {
  padding: 24px !important;
}

.enhanced-info-section .text-subtitle-2,
.enhanced-content-section .text-subtitle-2 {
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-weight: 600;
}

.enhanced-card .text-h4,
.enhanced-card .text-h6 {
  color: rgba(var(--v-theme-on-surface), 0.87);
  line-height: 1.2;
}

.enhanced-card .text-caption {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
}

/* Monospace font for IDs and codes */
.font-family-monospace {
  font-family: "Roboto Mono", "Monaco", "Consolas", monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

/* Better responsive behavior */
@media (max-width: 960px) {
  .enhanced-section:not(:last-child)::after {
    display: none;
  }

  .enhanced-section {
    margin-bottom: 16px;
    min-height: auto;
  }

  .enhanced-section:not(:last-child) {
    border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
    padding-bottom: 16px;
  }

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

/* Filter actions styling */
.text-caption.text-medium-emphasis {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
}

/* Table enhancements */
:deep(.v-data-table) {
  border-radius: 0;
}

:deep(.v-data-table__wrapper) {
  border-radius: 0;
}

/* Pagination controls */
.v-card-actions .v-btn {
  min-width: 80px;
}

.v-card-actions .v-chip {
  font-weight: 600;
}
</style>
