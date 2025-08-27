<template>
  <div class="dashboard-container">
    <!-- Header Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center flex-wrap">
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">จัดการอุปกรณ์</h1>
          </div>
          <div class="d-flex align-center ga-3 flex-wrap">
            <v-chip variant="tonal" color="primary">
              {{ selectedDevicesCount }} อุปกรณ์ที่เลือก
            </v-chip>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Device Type Tabs -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-tabs v-model="activeDeviceType" color="primary" class="mb-6">
          <v-tab value="car">เครื่องล้างรถ</v-tab>
          <v-tab value="helmet">เครื่องล้างหมวก</v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <!-- Main Content Row -->
    <v-row>
      <!-- System Configuration Panel -->
      <v-col cols="12" md="4">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-6">
            <h2 class="text-h5 font-weight-bold">การกำหนดค่าระบบ</h2>
          </v-card-title>
          <v-card-text class="pb-6">
            <!-- Search Bar for System Config -->
            <v-text-field
              v-model="systemConfigSearch"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              placeholder="ค้นหาการตั้งค่าระบบ"
              hide-details
              clearable
              class="mb-4"
            />
            
            <!-- System Config Placeholder -->
            <div class="system-config-placeholder">
              <v-sheet
                color="grey-lighten-4"
                rounded="lg"
                height="100"
                class="d-flex align-center justify-center"
              >
                <span class="text-grey-darken-1">พื้นที่การตั้งค่าระบบ</span>
              </v-sheet>
            </div>

            <!-- Apply System Config Button -->
            <div class="d-flex justify-end mt-4">
              <v-btn
                color="primary"
                :disabled="selectedDevicesCount === 0"
                @click="showApplySystemConfigDialog = true"
              >
                นำไปใช้
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Device Data Table -->
      <v-col cols="12" md="8">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="pa-6">
            <div class="d-flex justify-space-between align-center">
              <h2 class="text-h5 font-weight-bold">รายการอุปกรณ์</h2>
              <v-chip variant="tonal" color="primary">
                {{ filteredDevices.length }} อุปกรณ์
              </v-chip>
            </div>
          </v-card-title>

          <!-- Device Filter Section -->
          <v-card-text class="pb-2">
            <v-row>
              <!-- Device Search -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="deviceSearch"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  placeholder="ค้นหาด้วยชื่ออุปกรณ์ หรือรหัสเครื่อง"
                  hide-details
                  clearable
                />
              </v-col>

              <!-- Device Filter Dropdown -->
              <v-col cols="12" md="6">
                <v-combobox
                  v-model="selectedFilters"
                  :items="getFilterOptions()"
                  label="กรองตามสถานะ"
                  prepend-inner-icon="mdi-filter-variant"
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
                      :color="getStatusColor(item.raw)"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.raw }}
                    </v-chip>
                  </template>
                </v-combobox>
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Data Table -->
          <v-data-table
            v-model="selectedDevices"
            :headers="deviceHeaders"
            :items="filteredDevices"
            :items-per-page="10"
            class="elevation-0"
            hover
            show-select
            return-object
            item-value="id"
          >
            <!-- Device Name Column -->
            <template #[`item.deviceName`]="{ item }">
              <div class="text-body-2 font-weight-medium">
                {{ item.deviceName }}
              </div>
            </template>

            <!-- Model Column -->
            <template #[`item.model`]="{ item }">
              <div class="text-body-2">
                {{ item.model }}
              </div>
            </template>

            <!-- Status Column -->
            <template #[`item.status`]="{ item }">
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                variant="tonal"
              >
                {{ item.status }}
              </v-chip>
            </template>

            <!-- Location Column -->
            <template #[`item.location`]="{ item }">
              <div class="text-body-2">
                {{ item.location }}
              </div>
            </template>

            <!-- Owner Column -->
            <template #[`item.owner`]="{ item }">
              <div class="text-body-2">
                {{ item.owner }}
              </div>
            </template>

            <!-- Expandable Row Content -->
            <template #expanded-row="{ item }">
              <tr>
                <td :colspan="deviceHeaders.length + 1" class="pa-4">
                  <v-card flat color="grey-lighten-5">
                    <v-card-text>
                      <v-row>
                        <v-col cols="12" md="6">
                          <h4 class="text-h6 mb-3">รายละเอียดอุปกรณ์</h4>
                          <div class="mb-2">
                            <strong>รหัสอุปกรณ์:</strong> {{ item.id }}
                          </div>
                          <div class="mb-2">
                            <strong>รุ่น:</strong> {{ item.model }}
                          </div>
                          <div class="mb-2">
                            <strong>เวอร์ชันเฟิร์มแวร์:</strong> {{ item.firmwareVersion }}
                          </div>
                          <div class="mb-2">
                            <strong>ติดตั้งเมื่อ:</strong> {{ formatDate(item.installDate) }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <h4 class="text-h6 mb-3">สถิติการใช้งาน</h4>
                          <div class="mb-2">
                            <strong>ใช้งานครั้งสุดท้าย:</strong> {{ formatDateTime(item.lastUsed) }}
                          </div>
                          <div class="mb-2">
                            <strong>จำนวนการใช้งานวันนี้:</strong> {{ item.dailyUsage }} ครั้ง
                          </div>
                          <div class="mb-2">
                            <strong>รายได้วันนี้:</strong> ฿{{ item.dailyRevenue.toLocaleString('th-TH') }}
                          </div>
                        </v-col>
                      </v-row>
                      <div class="d-flex justify-end mt-4">
                        <v-btn
                          color="primary"
                          variant="outlined"
                          @click="openDeviceDetailDialog(item)"
                        >
                          รายละเอียดเพิ่มเติม / แก้ไข
                        </v-btn>
                      </div>
                    </v-card-text>
                  </v-card>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Apply System Config Confirmation Dialog -->
    <v-dialog v-model="showApplySystemConfigDialog" max-width="500">
      <v-card>
        <v-card-title class="pa-6">
          <h3 class="text-h5">ยืนยันการเปลี่ยนแปลงการตั้งค่า</h3>
        </v-card-title>
        <v-card-text>
          <p>คุณต้องการนำการตั้งค่าระบบไปใช้กับอุปกรณ์ที่เลือก {{ selectedDevicesCount }} เครื่องหรือไม่?</p>
          <v-alert color="warning" variant="tonal" class="mt-4">
            การเปลี่ยนแปลงนี้จะส่งผลต่อการทำงานของอุปกรณ์ทันที
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="outlined" @click="showApplySystemConfigDialog = false">
            ยกเลิก
          </v-btn>
          <v-btn color="primary" @click="applySystemConfig">
            ยืนยัน
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Device Detail Full Page Dialog -->
    <v-dialog v-model="showDeviceDetailDialog" fullscreen transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar color="primary" dark>
          <v-btn icon="mdi-close" @click="showDeviceDetailDialog = false" />
          <v-toolbar-title>การตั้งค่าอุปกรณ์ - {{ selectedDevice?.deviceName }}</v-toolbar-title>
          <v-spacer />
          <v-btn variant="text" @click="showApplyDeviceConfigDialog = true">
            บันทึก
          </v-btn>
        </v-toolbar>

        <v-container class="pa-8">
          <v-row>
            <v-col cols="12">
              <v-sheet
                color="grey-lighten-4"
                rounded="lg"
                height="400"
                class="d-flex align-center justify-center"
              >
                <span class="text-grey-darken-1">พื้นที่การตั้งค่าอุปกรณ์โดยละเอียด</span>
              </v-sheet>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>

    <!-- Apply Device Config Confirmation Dialog -->
    <v-dialog v-model="showApplyDeviceConfigDialog" max-width="500">
      <v-card>
        <v-card-title class="pa-6">
          <h3 class="text-h5">ยืนยันการเปลี่ยนแปลงการตั้งค่าอุปกรณ์</h3>
        </v-card-title>
        <v-card-text>
          <p>คุณต้องการบันทึกการตั้งค่าของอุปกรณ์ {{ selectedDevice?.deviceName }} หรือไม่?</p>
          <v-alert color="info" variant="tonal" class="mt-4">
            การเปลี่ยนแปลงจะมีผลหลังจากอุปกรณ์รีสตาร์ท
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="outlined" @click="showApplyDeviceConfigDialog = false">
            ยกเลิก
          </v-btn>
          <v-btn color="primary" @click="applyDeviceConfig">
            ยืนยัน
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
interface Device {
  id: string
  deviceName: string
  model: string
  status: string
  location: string
  owner: string
  firmwareVersion: string
  installDate: Date
  lastUsed: Date
  dailyUsage: number
  dailyRevenue: number
  type: 'car' | 'helmet'
}

// Reactive state
const activeDeviceType = ref<'car' | 'helmet'>('car')
const systemConfigSearch = ref('')
const deviceSearch = ref('')
const selectedFilters = ref<string[]>([])
const selectedDevices = ref<Device[]>([])
const showApplySystemConfigDialog = ref(false)
const showDeviceDetailDialog = ref(false)
const showApplyDeviceConfigDialog = ref(false)
const selectedDevice = ref<Device | null>(null)

// Mock device data
const allDevices = ref<Device[]>([
  // Car wash devices
  {
    id: 'CW001',
    deviceName: 'เครื่องล้างรถที่ 1',
    model: 'CarWash Pro X1',
    status: 'ใช้งานได้',
    location: 'จุดที่ A1',
    owner: 'สาขา A',
    firmwareVersion: '2.1.5',
    installDate: new Date('2023-01-15'),
    lastUsed: new Date('2024-01-20 14:30'),
    dailyUsage: 25,
    dailyRevenue: 2500,
    type: 'car'
  },
  {
    id: 'CW002',
    deviceName: 'เครื่องล้างรถที่ 2',
    model: 'CarWash Pro X1',
    status: 'กำลังใช้งาน',
    location: 'จุดที่ A2',
    owner: 'สาขา A',
    firmwareVersion: '2.1.5',
    installDate: new Date('2023-02-01'),
    lastUsed: new Date('2024-01-20 15:45'),
    dailyUsage: 18,
    dailyRevenue: 1800,
    type: 'car'
  },
  {
    id: 'CW003',
    deviceName: 'เครื่องล้างรถที่ 3',
    model: 'CarWash Basic',
    status: 'บำรุงรักษา',
    location: 'จุดที่ B1',
    owner: 'สาขา B',
    firmwareVersion: '2.0.8',
    installDate: new Date('2022-12-10'),
    lastUsed: new Date('2024-01-19 09:15'),
    dailyUsage: 0,
    dailyRevenue: 0,
    type: 'car'
  },
  // Helmet wash devices
  {
    id: 'HW001',
    deviceName: 'เครื่องล้างหมวกที่ 1',
    model: 'HelmetWash Mini',
    status: 'ใช้งานได้',
    location: 'จุดที่ A1-H',
    owner: 'สาขา A',
    firmwareVersion: '1.5.2',
    installDate: new Date('2023-03-20'),
    lastUsed: new Date('2024-01-20 16:20'),
    dailyUsage: 12,
    dailyRevenue: 360,
    type: 'helmet'
  },
  {
    id: 'HW002',
    deviceName: 'เครื่องล้างหมวกที่ 2',
    model: 'HelmetWash Mini',
    status: 'ขัดข้อง',
    location: 'จุดที่ B1-H',
    owner: 'สาขา B',
    firmwareVersion: '1.4.9',
    installDate: new Date('2023-04-05'),
    lastUsed: new Date('2024-01-18 11:30'),
    dailyUsage: 3,
    dailyRevenue: 90,
    type: 'helmet'
  }
])

// Table headers
const deviceHeaders = [
  { title: 'ชื่ออุปกรณ์', key: 'deviceName', sortable: true },
  { title: 'รุ่น', key: 'model', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: true },
  { title: 'ตำแหน่ง', key: 'location', sortable: true },
  { title: 'เจ้าของ', key: 'owner', sortable: true }
]

// Computed properties
const filteredDevices = computed(() => {
  let filtered = allDevices.value.filter(device => device.type === activeDeviceType.value)
  
  // Search filter
  if (deviceSearch.value && deviceSearch.value.trim()) {
    const query = deviceSearch.value.toLowerCase()
    filtered = filtered.filter(device => 
      device.deviceName.toLowerCase().includes(query) ||
      device.id.toLowerCase().includes(query)
    )
  }
  
  // Status filter
  if (selectedFilters.value.length > 0) {
    filtered = filtered.filter(device => 
      selectedFilters.value.includes(device.status)
    )
  }
  
  return filtered
})

const selectedDevicesCount = computed(() => selectedDevices.value.length)

// Methods
const getFilterOptions = () => {
  const statuses = [...new Set(allDevices.value
    .filter(device => device.type === activeDeviceType.value)
    .map(device => device.status))]
  return statuses
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ใช้งานได้': return 'success'
    case 'กำลังใช้งาน': return 'info'
    case 'บำรุงรักษา': return 'warning'
    case 'ขัดข้อง': return 'error'
    default: return 'grey'
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateTime = (date: Date) => {
  return date.toLocaleString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const openDeviceDetailDialog = (device: Device) => {
  selectedDevice.value = device
  showDeviceDetailDialog.value = true
}

const applySystemConfig = () => {
  // TODO: Implement system config application logic
  showApplySystemConfigDialog.value = false
  // Show success notification or handle errors
}

const applyDeviceConfig = () => {
  // TODO: Implement device config save logic
  showApplyDeviceConfigDialog.value = false
  showDeviceDetailDialog.value = false
  // Show success notification or handle errors
}

// Clear selected devices when switching tabs
watch(activeDeviceType, () => {
  selectedDevices.value = []
  selectedFilters.value = []
  deviceSearch.value = ''
})
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.system-config-placeholder {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 16px;
}

/* Mobile responsiveness */
@media (max-width: 960px) {
  .dashboard-container {
    padding: 0 16px;
  }
}

@media (max-width: 600px) {
  .dashboard-container {
    padding: 0 12px;
  }
}
</style>