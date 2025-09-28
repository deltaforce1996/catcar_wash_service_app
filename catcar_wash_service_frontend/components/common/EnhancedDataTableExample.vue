<template>
  <div>
    <!-- Example Usage of EnhancedDataTable Component -->
    <EnhancedDataTable
      title="ตัวอย่างตารางข้อมูลขั้นสูง"
      :headers="sampleHeaders"
      :items="filteredData"
      :loading="isLoading"
      :has-filter-changes="hasFilterChanges"
      :show-filter-actions="true"
      :expandable="true"
      :selectable="true"
      select-strategy="page"
      @apply-filters="applyFilters"
      @clear-filters="clearAllFilters"
      @update:selected="handleSelectionUpdate"
    >
      <!-- Custom Filters -->g
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
                placeholder="ค้นหาด้วยชื่อ อีเมล เบอร์โทร"
                hide-details
                clearable
                aria-label="ค้นหาข้อมูล"
                role="searchbox"
              />
            </div>
          </v-col>

          <!-- Status Filter -->
          <v-col cols="12" md="3">
            <div class="d-flex flex-column ga-2">
              <div class="text-caption text-medium-emphasis">
                <v-icon size="small" class="me-1">mdi-filter-variant</v-icon>
                กรองตามสถานะ
              </div>
              <v-btn-group variant="outlined" density="compact" divided>
                <v-btn
                  v-for="status in statusOptions"
                  :key="status"
                  :color="getStatusColor(status)"
                  :variant="tempStatusFilter === status ? 'flat' : 'outlined'"
                  size="small"
                  class="text-none"
                  @click="selectStatusFilter(status)"
                >
                  {{ getStatusLabel(status) }}
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
            </div>
          </v-col>

          <!-- Type Filter -->
          <v-col cols="12" md="3">
            <div class="d-flex flex-column ga-2">
              <div class="text-caption text-medium-emphasis">
                <v-icon size="small" class="me-1">mdi-filter-variant</v-icon>
                กรองตามประเภท
              </div>
              <v-combobox
                v-model="tempTypeFilter"
                :items="typeOptions"
                label="เลือกประเภท"
                prepend-inner-icon="mdi-tag"
                variant="outlined"
                density="compact"
                chips
                clearable
                closable-chips
                multiple
                hide-details
              >
                <template #chip="{ props, item }">
                  <v-chip
                    v-bind="props"
                    :color="getTypeColor(item.raw)"
                    size="small"
                    variant="tonal"
                  >
                    {{ item.raw }}
                  </v-chip>
                </template>
              </v-combobox>
            </div>
          </v-col>
        </v-row>
      </template>

      <!-- Custom Column Templates -->
      <template #[`item.name`]="{ item }">
        <div>
          <div class="text-body-2 font-weight-medium">
            {{ item.name }}
          </div>
          <div v-if="item.nickname" class="text-caption text-medium-emphasis">
            {{ item.nickname }}
          </div>
        </div>
      </template>

      <template #[`item.email`]="{ item }">
        <div class="text-body-2">
          {{ item.email }}
        </div>
      </template>

      <template #[`item.phone`]="{ item }">
        <div class="text-body-2">
          {{ item.phone }}
        </div>
      </template>

      <template #[`item.status`]="{ item }">
        <v-chip
          :color="getStatusColor(item.status)"
          size="small"
          variant="tonal"
        >
          {{ getStatusLabel(item.status) }}
        </v-chip>
      </template>

      <template #[`item.type`]="{ item }">
        <v-chip :color="getTypeColor(item.type)" size="small" variant="tonal">
          {{ item.type }}
        </v-chip>
      </template>

      <template #[`item.created_at`]="{ item }">
        <div class="text-body-2">
          {{ formatDate(item.created_at) }}
        </div>
      </template>

      <!-- Actions Column -->
      <template #actions="{ item }">
        <div class="d-flex ga-1">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            color="primary"
            @click="editItem(item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="deleteItem(item)"
          />
        </div>
      </template>

      <!-- Expandable Row Content -->
      <template #expanded-row="{ item }">
        <h3 class="text-subtitle-1 font-weight-bold mb-4">
          รายละเอียดเพิ่มเติม
        </h3>

        <!-- Details grid matching ex-user-mgmt.vue style -->
        <v-row no-gutters class="enhanced-details-grid">
          <!-- Personal Information Section -->
          <v-col cols="12" md="6" class="enhanced-section">
            <div class="enhanced-info-section pa-3">
              <div class="d-flex align-center mb-3">
                <v-icon color="primary" size="small" class="me-2">
                  mdi-account-circle
                </v-icon>
                <span class="text-subtitle-2 font-weight-medium">
                  ข้อมูลส่วนตัว
                </span>
              </div>

              <div class="enhanced-info-grid">
                <v-card class="mb-2" color="primary" variant="tonal">
                  <v-card-text class="pa-3">
                    <div class="text-caption text-medium-emphasis">
                      รหัสผู้ใช้
                    </div>
                    <div class="text-body-2 font-family-monospace">
                      {{ item.id.slice(-8) }}
                    </div>
                  </v-card-text>
                </v-card>

                <v-card class="mb-2" color="info" variant="tonal">
                  <v-card-text class="pa-3">
                    <div class="text-caption text-medium-emphasis">ที่อยู่</div>
                    <div class="text-body-2">
                      {{ item.address || "ไม่ระบุ" }}
                    </div>
                  </v-card-text>
                </v-card>

                <v-card color="secondary" variant="tonal">
                  <v-card-text class="pa-3">
                    <div class="text-caption text-medium-emphasis">
                      ประเภทผู้ใช้
                    </div>
                    <v-chip
                      :color="getTypeColor(item.type)"
                      size="small"
                      variant="tonal"
                      class="mt-1"
                    >
                      {{ item.type }}
                    </v-chip>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </v-col>

          <!-- Statistics Section -->
          <v-col cols="12" md="6" class="enhanced-section">
            <div class="enhanced-content-section pa-3">
              <div class="d-flex align-center mb-3">
                <v-icon color="success" size="small" class="me-2">
                  mdi-chart-line
                </v-icon>
                <span class="text-subtitle-2 font-weight-medium">
                  สถิติการใช้งาน
                </span>
              </div>

              <div>
                <v-row dense>
                  <v-col cols="12">
                    <v-card
                      class="enhanced-card"
                      color="success-lighten-1"
                      variant="tonal"
                    >
                      <v-card-text class="pa-3 text-center">
                        <div class="text-h4 font-weight-bold text-success">
                          {{ item.stats?.total || 0 }}
                        </div>
                        <div class="text-caption">การใช้งานทั้งหมด</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="6">
                    <v-card
                      class="enhanced-card"
                      color="primary-lighten-1"
                      variant="tonal"
                    >
                      <v-card-text class="pa-2 text-center">
                        <div class="text-h6 font-weight-bold">
                          {{ item.stats?.active || 0 }}
                        </div>
                        <div class="text-caption">ใช้งานอยู่</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="6">
                    <v-card
                      class="enhanced-card"
                      color="error-lighten-1"
                      variant="tonal"
                    >
                      <v-card-text class="pa-2 text-center">
                        <div class="text-h6 font-weight-bold">
                          {{ item.stats?.inactive || 0 }}
                        </div>
                        <div class="text-caption">ไม่ใช้งาน</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Timestamp Information -->
        <v-divider class="my-4" />
        <div
          class="d-flex justify-space-between text-caption text-medium-emphasis"
        >
          <span>สร้างเมื่อ: {{ formatDateTime(item.created_at) }}</span>
          <span>อัปเดตล่าสุด: {{ formatDateTime(item.updated_at) }}</span>
        </div>
      </template>
    </EnhancedDataTable>

    <!-- Selected Items Display -->
    <v-card v-if="selectedItems.length > 0" class="mt-4" elevation="1">
      <v-card-title>
        <h3 class="text-h6">รายการที่เลือก ({{ selectedItems.length }})</h3>
      </v-card-title>
      <v-card-text>
        <v-chip-group>
          <v-chip
            v-for="item in selectedItems"
            :key="item.id"
            color="primary"
            variant="tonal"
            closable
            @click:close="removeFromSelection(item)"
          >
            {{ item.name }}
          </v-chip>
        </v-chip-group>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
// Import the EnhancedDataTable component
import EnhancedDataTable from "./EnhancedDataTable.vue";

// Sample data interface
interface SampleItem {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  type: "USER" | "ADMIN" | "GUEST";
  address?: string;
  created_at: string;
  updated_at: string;
  stats?: {
    total: number;
    active: number;
    inactive: number;
  };
}

// Sample data
const sampleData = ref<SampleItem[]>([
  {
    id: "user-001",
    name: "สมชาย ใจดี",
    nickname: "ชาย",
    email: "somchai@example.com",
    phone: "081-234-5678",
    status: "ACTIVE",
    type: "USER",
    address: "กรุงเทพมหานคร",
    created_at: "2024-01-15T08:30:00Z",
    updated_at: "2024-03-20T14:22:00Z",
    stats: {
      total: 45,
      active: 32,
      inactive: 13,
    },
  },
  {
    id: "user-002",
    name: "สมหญิง สวยงาม",
    nickname: "หญิง",
    email: "somying@example.com",
    phone: "082-345-6789",
    status: "INACTIVE",
    type: "ADMIN",
    address: "เชียงใหม่",
    created_at: "2024-02-10T10:15:00Z",
    updated_at: "2024-03-18T09:45:00Z",
    stats: {
      total: 28,
      active: 15,
      inactive: 13,
    },
  },
  {
    id: "user-003",
    name: "สมศักดิ์ มีชัย",
    email: "somsak@example.com",
    phone: "083-456-7890",
    status: "PENDING",
    type: "GUEST",
    address: "ภูเก็ต",
    created_at: "2024-03-05T16:20:00Z",
    updated_at: "2024-03-22T11:10:00Z",
    stats: {
      total: 12,
      active: 8,
      inactive: 4,
    },
  },
]);

// Component state
const isLoading = ref(false);
const selectedItems = ref<SampleItem[]>([]);

// Filter state
const tempSearchQuery = ref("");
const tempStatusFilter = ref<"ACTIVE" | "INACTIVE" | "PENDING" | null>(null);
const tempTypeFilter = ref<string[]>([]);

// Applied filter state
const searchQuery = ref("");
const statusFilter = ref<"ACTIVE" | "INACTIVE" | "PENDING" | null>(null);
const typeFilter = ref<string[]>([]);

// Filter options
const statusOptions: ("ACTIVE" | "INACTIVE" | "PENDING")[] = [
  "ACTIVE",
  "INACTIVE",
  "PENDING",
];
const typeOptions = ["USER", "ADMIN", "GUEST"];

// Table headers
const sampleHeaders = [
  { title: "ชื่อ", key: "name", sortable: true },
  { title: "อีเมล", key: "email", sortable: true },
  { title: "เบอร์โทร", key: "phone", sortable: true },
  { title: "สถานะ", key: "status", sortable: true },
  { title: "ประเภท", key: "type", sortable: true },
  { title: "วันที่สร้าง", key: "created_at", sortable: true },
  { title: "การดำเนินการ", key: "actions", sortable: false },
  { title: "", key: "data-table-expand", sortable: false },
];

// Computed
const hasFilterChanges = computed(() => {
  return (
    tempSearchQuery.value !== searchQuery.value ||
    tempStatusFilter.value !== statusFilter.value ||
    JSON.stringify([...tempTypeFilter.value].sort()) !==
      JSON.stringify([...typeFilter.value].sort())
  );
});

const filteredData = computed(() => {
  let filtered = sampleData.value;

  // Search filter
  if (searchQuery.value && searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.phone.includes(query)
    );
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter((item) => item.status === statusFilter.value);
  }

  // Type filter
  if (typeFilter.value.length > 0) {
    filtered = filtered.filter((item) => typeFilter.value.includes(item.type));
  }

  return filtered;
});

// Methods
const applyFilters = () => {
  searchQuery.value = tempSearchQuery.value;
  statusFilter.value = tempStatusFilter.value;
  typeFilter.value = [...tempTypeFilter.value];
};

const clearAllFilters = () => {
  // Clear both temp and actual values
  tempSearchQuery.value = "";
  tempStatusFilter.value = null;
  tempTypeFilter.value = [];

  searchQuery.value = "";
  statusFilter.value = null;
  typeFilter.value = [];
};

const selectStatusFilter = (status: "ACTIVE" | "INACTIVE" | "PENDING") => {
  tempStatusFilter.value = status;
};

const clearStatusFilter = () => {
  tempStatusFilter.value = null;
};

const handleSelectionUpdate = (items: SampleItem[]) => {
  selectedItems.value = [...items];
};

const removeFromSelection = (item: SampleItem) => {
  selectedItems.value = selectedItems.value.filter(
    (selected) => selected.id !== item.id
  );
};

const editItem = (item: SampleItem) => {
  console.log("Edit item:", item);
  // Implement edit logic
};

const deleteItem = (item: SampleItem) => {
  console.log("Delete item:", item);
  // Implement delete logic
};

// Utility functions
const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "INACTIVE":
      return "error";
    case "PENDING":
      return "warning";
    default:
      return "grey";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "ใช้งาน";
    case "INACTIVE":
      return "ไม่ใช้งาน";
    case "PENDING":
      return "รอดำเนินการ";
    default:
      return status;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "ADMIN":
      return "primary";
    case "USER":
      return "info";
    case "GUEST":
      return "secondary";
    default:
      return "grey";
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Initialize temp values on component mount
onMounted(() => {
  tempSearchQuery.value = searchQuery.value;
  tempStatusFilter.value = statusFilter.value;
  tempTypeFilter.value = [...typeFilter.value];
});
</script>

<style scoped>
/* Additional styles for example */
.enhanced-details-grid {
  gap: 0;
}

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

.enhanced-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  min-height: 60px;
}

.enhanced-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.font-family-monospace {
  font-family: "Roboto Mono", "Monaco", "Consolas", monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

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
}
</style>
