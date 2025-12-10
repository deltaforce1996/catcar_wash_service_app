<template>
  <div>
    <!-- Header Section -->
    <div class="d-flex justify-space-between align-center flex-wrap mb-5">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">จัดการโปรโมชั่น</h1>
      </div>
      <div class="d-flex align-center ga-3 flex-wrap">
        <v-btn
          color="primary"
          prepend-icon="mdi-tag-plus"
          class="text-none"
          @click="showAddPromotionDialog = true"
        >
          สร้างโปรโมชั่นใหม่
        </v-btn>
      </div>
    </div>

    <!-- Enhanced Data Table -->
    <EnhancedDataTable
      title="รายการโปรโมชั่น"
      :items="promotions"
      :headers="promotionHeaders"
      :loading="isSearching || loading"
      :has-filter-changes="hasFilterChanges"
      :page="currentSearchParams.page || 1"
      :total-items="totalPromotions"
      :total-pages="totalPages"
      expandable
      @apply-filters="applyFilters"
      @clear-filters="clearAllFilters"
      @update:page="goToPage"
    >
      <!-- Filter Section -->
      <template #filters>
        <v-row>
          <!-- Search Bar -->
          <v-col cols="12" md="6">
            <div class="d-flex flex-column ga-2">
              <div class="text-caption text-medium-emphasis">
                <v-icon size="small" class="me-1">mdi-filter-variant</v-icon>
                ค้นหา
              </div>
              <v-text-field
                v-model="tempSearchQuery"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                placeholder="ค้นหาด้วยชื่อโปรโมชั่น รายละเอียด"
                hide-details
                clearable
              />
            </div>
          </v-col>

          <!-- Status Filter -->
          <v-col cols="12" md="3" class="d-flex flex-column ga-2">
            <div class="text-caption text-medium-emphasis">
              <v-icon size="small" class="me-1">mdi-filter-variant</v-icon>
              กรองตามสถานะ
            </div>
            <v-btn-group variant="outlined" density="compact" divided>
              <v-btn
                color="success"
                :variant="tempStatusFilter === true ? 'flat' : 'outlined'"
                size="small"
                class="text-none"
                @click="selectStatusFilter(true)"
              >
                เปิดใช้งาน
              </v-btn>
              <v-btn
                color="error"
                :variant="tempStatusFilter === false ? 'flat' : 'outlined'"
                size="small"
                class="text-none"
                @click="selectStatusFilter(false)"
              >
                ปิดใช้งาน
              </v-btn>
              <v-btn
                color="primary"
                :variant="tempStatusFilter === null ? 'flat' : 'outlined'"
                size="small"
                class="text-none"
                @click="clearStatusFilter"
              >
                <v-icon size="small">mdi-close</v-icon>
                ทั้งหมด
              </v-btn>
            </v-btn-group>
          </v-col>
        </v-row>
      </template>

      <!-- Custom Column Templates -->
      <template #[`item.name`]="{ item }">
        <div class="text-body-2 font-weight-medium">
          {{ item.name }}
        </div>
      </template>

      <template #[`item.discount_percent`]="{ item }">
        <v-chip color="primary" size="small" variant="tonal">
          {{ item.discount_percent }}%
        </v-chip>
      </template>

      <template #[`item.start_date`]="{ item }">
        <div class="text-body-2">
          {{ formatDateTime(item.start_date) }}
        </div>
      </template>

      <template #[`item.end_date`]="{ item }">
        <div class="text-body-2">
          {{ formatDateTime(item.end_date) }}
        </div>
      </template>

      <template #[`item.is_active`]="{ item }">
        <v-chip
          :color="item.is_active ? 'success' : 'error'"
          size="small"
          variant="tonal"
        >
          {{ item.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน" }}
        </v-chip>
      </template>

      <template #[`item.assigned_users_count`]="{ item }">
        <v-chip size="small" variant="tonal">
          {{ item.assigned_users.length }} คน
        </v-chip>
      </template>

      <!-- Expandable Row Content -->
      <template #expanded-content="{ item }">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="text-subtitle-1 font-weight-bold">รายละเอียดโปรโมชั่น</h3>
          <div class="d-flex ga-2">
            <v-btn
              v-if="item.is_active"
              color="error"
              variant="outlined"
              prepend-icon="mdi-close-circle"
              class="text-none"
              :loading="loading"
              :disabled="loading"
              @click="confirmToggleStatus(item, false)"
            >
              ปิดใช้งาน
            </v-btn>
            <v-btn
              v-else
              color="success"
              variant="outlined"
              prepend-icon="mdi-check-circle"
              class="text-none"
              :loading="loading"
              :disabled="loading"
              @click="confirmToggleStatus(item, true)"
            >
              เปิดใช้งาน
            </v-btn>
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-pencil"
              class="text-none"
              @click="handleEditPromotion(item)"
            >
              แก้ไขโปรโมชั่น
            </v-btn>
          </div>
        </div>

        <v-row>
          <!-- Promotion Info -->
          <v-col cols="12" md="6">
            <v-card color="surface-container" variant="flat">
              <v-card-text class="pa-4">
                <div class="mb-3">
                  <div class="text-caption text-medium-emphasis">ชื่อโปรโมชั่น</div>
                  <div class="text-body-1 font-weight-medium">{{ item.name }}</div>
                </div>
                <div class="mb-3">
                  <div class="text-caption text-medium-emphasis">รายละเอียด</div>
                  <div class="text-body-2">{{ item.description || "ไม่ระบุ" }}</div>
                </div>
                <div class="mb-3">
                  <div class="text-caption text-medium-emphasis">ส่วนลด</div>
                  <v-chip color="primary" size="small" variant="tonal" class="mt-1">
                    {{ item.discount_percent }}%
                  </v-chip>
                </div>
                <div>
                  <div class="text-caption text-medium-emphasis">สถานะการใช้งาน</div>
                  <v-chip
                    :color="item.is_active ? 'success' : 'error'"
                    size="small"
                    variant="tonal"
                    class="mt-1"
                  >
                    {{ item.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน" }}
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Assigned Users -->
          <v-col cols="12" md="6">
            <v-card color="surface-container" variant="flat">
              <v-card-text class="pa-4">
                <div class="text-subtitle-2 font-weight-medium mb-2">
                  ลูกค้าที่ได้รับส่วนลด ({{ item.assigned_users.length }} คน)
                </div>
                <v-divider class="mb-3" />
                <div v-if="item.assigned_users.length === 0" class="text-body-2 text-medium-emphasis">
                  ยังไม่มีลูกค้าที่ได้รับส่วนลด
                </div>
                <div v-else class="d-flex flex-wrap ga-2">
                  <v-chip
                    v-for="assignedUser in item.assigned_users"
                    :key="assignedUser.id"
                    color="primary"
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-account"
                  >
                    {{ assignedUser.user.fullname }} ({{ assignedUser.user.email }})
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </EnhancedDataTable>

    <!-- Dialogs -->
    <AddPromotionDialog
      v-model="showAddPromotionDialog"
      @success="handlePromotionCreated"
    />

    <EditPromotionDialog
      v-model="showEditPromotionDialog"
      :promotion="selectedPromotion"
      @success="handlePromotionUpdated"
    />

    <DeviceSyncResultDialog
      v-model="showDeviceSyncDialog"
      :results="deviceSyncResults"
    />

    <!-- Confirm Toggle Status Dialog -->
    <v-dialog v-model="showConfirmDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon :color="pendingStatus ? 'success' : 'error'" class="mr-2">
            {{ pendingStatus ? 'mdi-check-circle' : 'mdi-close-circle' }}
          </v-icon>
          ยืนยันการเปลี่ยนสถานะโปรโมชั่น
        </v-card-title>

        <v-card-text>
          <p class="text-body-1">
            คุณต้องการ<strong>{{ pendingStatus ? 'เปิด' : 'ปิด' }}ใช้งาน</strong>โปรโมชั่น
            "<strong>{{ pendingPromotion?.name }}</strong>" ใช่หรือไม่?
          </p>
          <v-alert
            :color="pendingStatus ? 'success' : 'error'"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            <v-icon class="mr-1">mdi-information</v-icon>
            {{ pendingStatus ? 'โปรโมชั่นจะถูกเปิดใช้งานทันที' : 'โปรโมชั่นจะถูกปิดใช้งานทันที' }}
          </v-alert>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn color="grey" variant="text" :disabled="loading" @click="cancelToggle">
            กลับไป
          </v-btn>
          <v-btn
            :color="pendingStatus ? 'success' : 'error'"
            variant="elevated"
            :loading="loading"
            @click="confirmToggle"
          >
            ยืนยัน
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { PromotionResponseApi, DeviceUpdateResult } from "~/types";
import { usePromotion } from "~/composables/usePromotion";
import { useAuth } from "~/composables/useAuth";
import EnhancedDataTable from "~/components/common/EnhancedDataTable.vue";
import AddPromotionDialog from "~/components/promotion/AddPromotionDialog.vue";
import EditPromotionDialog from "~/components/promotion/EditPromotionDialog.vue";
import DeviceSyncResultDialog from "~/components/promotion/DeviceSyncResultDialog.vue";

// Check authentication and permissions
const { isAdmin } = useAuth();

// Redirect if not admin
onMounted(() => {
  if (!isAdmin.value) {
    navigateTo("/");
  }
});

// Composable
const {
  promotions,
  currentSearchParams,
  totalPromotions,
  totalPages,
  isSearching,
  searchPromotions,
  goToPage,
  updatePromotionById,
} = usePromotion();

// Local state
const loading = ref(false);
const showAddPromotionDialog = ref(false);
const showEditPromotionDialog = ref(false);
const selectedPromotion = ref<PromotionResponseApi | null>(null);
const showDeviceSyncDialog = ref(false);
const deviceSyncResults = ref<DeviceUpdateResult[] | undefined>(undefined);

// Confirm dialog state
const showConfirmDialog = ref(false);
const pendingPromotion = ref<PromotionResponseApi | null>(null);
const pendingStatus = ref<boolean>(false);

// Filter states
const tempSearchQuery = ref("");
const tempStatusFilter = ref<boolean | null>(null);
const appliedSearchQuery = ref("");
const appliedStatusFilter = ref<boolean | null>(null);

// Computed
const hasFilterChanges = computed(() => {
  return (
    tempSearchQuery.value !== appliedSearchQuery.value ||
    tempStatusFilter.value !== appliedStatusFilter.value
  );
});

// Table headers
const promotionHeaders = [
  { title: "ชื่อโปรโมชั่น", key: "name", sortable: false },
  { title: "ส่วนลด", key: "discount_percent", sortable: false },
  { title: "วันเริ่มต้น", key: "start_date", sortable: false },
  { title: "วันสิ้นสุด", key: "end_date", sortable: false },
  { title: "สถานะ", key: "is_active", sortable: false },
  { title: "จำนวนลูกค้า", key: "assigned_users_count", sortable: false },
];

// Format date time
const formatDateTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Filter functions
const selectStatusFilter = (status: boolean) => {
  tempStatusFilter.value = status;
};

const clearStatusFilter = () => {
  tempStatusFilter.value = null;
};

// Apply filters
const applyFilters = async () => {
  appliedSearchQuery.value = tempSearchQuery.value;
  appliedStatusFilter.value = tempStatusFilter.value;

  const query: Record<string, string> = {};

  if (appliedSearchQuery.value) {
    query.search = appliedSearchQuery.value;
  }

  if (appliedStatusFilter.value !== null) {
    query.is_active = appliedStatusFilter.value.toString();
  }

  await searchPromotions({
    query: Object.keys(query).length > 0 ? query : undefined,
    page: 1,
  });
};

// Clear all filters
const clearAllFilters = async () => {
  tempSearchQuery.value = "";
  tempStatusFilter.value = null;
  appliedSearchQuery.value = "";
  appliedStatusFilter.value = null;

  await searchPromotions({ page: 1 });
};

// Show confirm dialog for toggle status
const confirmToggleStatus = (promotion: PromotionResponseApi, newStatus: boolean) => {
  pendingPromotion.value = promotion;
  pendingStatus.value = newStatus;
  showConfirmDialog.value = true;
};

// Cancel toggle
const cancelToggle = () => {
  showConfirmDialog.value = false;
  pendingPromotion.value = null;
  pendingStatus.value = false;
};

// Confirm and execute toggle
const confirmToggle = async () => {
  if (!pendingPromotion.value) return;

  try {
    loading.value = true;
    await updatePromotionById(pendingPromotion.value.id, {
      is_active: pendingStatus.value,
    });
    // Refresh data after update
    await applyFilters();
    // Close dialog
    showConfirmDialog.value = false;
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะโปรโมชั่น:", err);
  } finally {
    loading.value = false;
    pendingPromotion.value = null;
    pendingStatus.value = false;
  }
};

// Edit promotion
const handleEditPromotion = (promotion: PromotionResponseApi) => {
  selectedPromotion.value = promotion;
  showEditPromotionDialog.value = true;
};

// Success handlers
const handlePromotionCreated = async (results?: DeviceUpdateResult[]) => {
  await applyFilters();

  if (results && results.length > 0) {
    deviceSyncResults.value = results;
    showDeviceSyncDialog.value = true;
  }
};

const handlePromotionUpdated = async (results?: DeviceUpdateResult[]) => {
  await applyFilters();

  if (results && results.length > 0) {
    deviceSyncResults.value = results;
    showDeviceSyncDialog.value = true;
  }
};

// Initial load
onMounted(async () => {
  await searchPromotions();
});
</script>
