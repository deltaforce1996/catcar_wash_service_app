<template>
  <!-- Device Detail Full Page Dialog -->
  <v-dialog
    v-model="showDialog"
    fullscreen
    transition="dialog-bottom-transition"
  >
    <v-card>
      <v-toolbar color="primary" dark>
        <v-btn icon="mdi-close" @click="closeDialog" />
        <v-toolbar-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-cog</v-icon>
          การตั้งค่าอุปกรณ์ - {{ device?.name }}
        </v-toolbar-title>
        <v-spacer />
        
        <!-- Edit Mode Toggle -->
        <v-btn
          :color="isEditMode ? 'warning' : 'info'"
          variant="elevated"
          class="mr-3"
          @click="toggleEditMode"
        >
          <v-icon class="mr-1">
            {{ isEditMode ? 'mdi-eye' : 'mdi-pencil' }}
          </v-icon>
          {{ isEditMode ? 'ดูอย่างเดียว' : 'แก้ไข' }}
        </v-btn>
        
        <!-- Save Button (only show in edit mode with changes) -->
        <v-btn
          v-if="isEditMode"
          :color="hasConfigChanges ? 'success' : 'grey'"
          :disabled="!hasConfigChanges"
          variant="elevated"
          @click="$emit('save')"
        >
          <v-icon class="mr-1">mdi-content-save</v-icon>
          {{ hasConfigChanges ? 'บันทึกการเปลี่ยนแปลง' : 'ไม่มีการเปลี่ยนแปลง' }}
        </v-btn>
      </v-toolbar>

      <v-container class="pa-6">
        <v-row>
          <!-- Device Image and Info Section -->
          <v-col cols="12" lg="4">
            <v-card elevation="3" rounded="lg">
              <v-card-text class="pa-4">
                <!-- Device Image -->
                <div class="text-center mb-4">
                  <v-avatar
                    size="120"
                    color="grey-lighten-3"
                    class="mb-3"
                  >
                    <v-icon size="60" color="grey-darken-1">
                      {{ device?.type === 'WASH' ? 'mdi-car-wash' : 'mdi-air-filter' }}
                    </v-icon>
                  </v-avatar>
                  <h3 class="text-h5 font-weight-bold">{{ device?.name }}</h3>
                  <v-chip
                    :color="getTypeColor(device?.type || '')"
                    size="small"
                    variant="tonal"
                    class="mt-2"
                  >
                    {{ getTypeLabel(device?.type || '') }}
                  </v-chip>
                </div>
                
                <!-- Device Status -->
                <v-card flat color="grey-lighten-5" class="mb-4">
                  <v-card-text class="pa-3">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="font-weight-medium">สถานะ:</span>
                      <v-chip
                        :color="getStatusColor(device?.status || '')"
                        size="small"
                        variant="tonal"
                      >
                        {{ getStatusLabel(device?.status || '') }}
                      </v-chip>
                    </div>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="font-weight-medium">รหัสอุปกรณ์:</span>
                      <span class="text-body-2">{{ device?.id.slice(-8) }}</span>
                    </div>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="font-weight-medium">เจ้าของ:</span>
                      <span class="text-body-2">{{ device?.owner.fullname }}</span>
                    </div>
                    <div class="d-flex justify-space-between align-center">
                      <span class="font-weight-medium">ลงทะเบียนโดย:</span>
                      <span class="text-body-2">{{ device?.registered_by.name }}</span>
                    </div>
                  </v-card-text>
                </v-card>
                
                <!-- Device Description -->
                <v-card flat color="info" variant="tonal">
                  <v-card-text class="pa-3">
                    <div class="d-flex align-start">
                      <v-icon class="mr-2 mt-1" size="20">mdi-information</v-icon>
                      <div>
                        <div class="font-weight-medium mb-1">คำอธิบาย</div>
                        <p class="text-body-2 mb-0">
                          {{ getDeviceDescription(device?.type || '') }}
                        </p>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- Sale Configuration Section -->
          <v-col cols="12" lg="8">
            <!-- Device Status Control Card (only in edit mode) -->
            <v-card v-if="isEditMode" elevation="3" rounded="lg" class="mb-4">
              <v-card-title class="d-flex align-center pa-4">
                <v-icon class="mr-2" color="primary">mdi-power</v-icon>
                <span>การควบคุมสถานะอุปกรณ์</span>
              </v-card-title>
              
              <v-card-text class="pa-4">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <h3 class="text-h6 font-weight-bold mb-1">
                      สถานะการทำงาน
                    </h3>
                    <p class="text-body-2 text-grey-darken-1 mb-0">
                      {{ device?.status === 'DEPLOYED' ? 'อุปกรณ์กำลังทำงานอยู่และพร้อมให้บริการ' : 'อุปกรณ์หยุดทำงานชั่วคราว' }}
                    </p>
                  </div>
                  
                  <div class="d-flex align-center">
                    <span class="text-body-2 mr-3">
                      {{ device?.status === 'DEPLOYED' ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
                    </span>
                    <v-switch
                      :model-value="device?.status === 'DEPLOYED'"
                      :color="device?.status === 'DEPLOYED' ? 'success' : 'error'"
                      hide-details
                      @update:model-value="$emit('toggleStatus')"
                    />
                  </div>
                </div>
                
                <v-alert
                  v-if="device?.status !== 'DEPLOYED'"
                  color="warning"
                  variant="tonal"
                  class="mt-4"
                  density="compact"
                >
                  <v-icon class="mr-1">mdi-alert</v-icon>
                  เมื่อปิดใช้งาน ลูกค้าจะไม่สามารถใช้บริการอุปกรณ์นี้ได้
                </v-alert>
              </v-card-text>
            </v-card>
            
            <v-card elevation="3" rounded="lg">
              <v-card-title class="d-flex align-center pa-4">
                <v-icon class="mr-2" color="primary">mdi-cog-outline</v-icon>
                <span>การตั้งค่าการขาย</span>
                <v-spacer />
                <div class="d-flex align-center ga-2">
                  <v-chip
                    v-if="isEditMode && hasConfigChanges"
                    color="error"
                    size="x-small"
                    variant="elevated"
                    class="text-caption"
                  >
                    {{ configChangeCount }} การเปลี่ยนแปลง
                  </v-chip>
                  <v-chip
                    :color="isEditMode ? 'warning' : 'success'"
                    size="small"
                    variant="tonal"
                  >
                    {{ isEditMode ? 'โหมดแก้ไข' : 'โหมดดู' }}
                  </v-chip>
                </div>
              </v-card-title>
              
              <v-card-text class="pa-4">
                <v-row dense>
                  <v-col
                    v-for="(config, key) in (isEditMode ? editableConfigs : device?.configs.sale)"
                    :key="key"
                    cols="12" sm="6" md="4" lg="3"
                  >
                    <v-card
                      flat
                      :color="getConfigCardColor(key)"
                      class="pa-3 border"
                      :class="getConfigCardClass(key)"
                      height="120"
                    >
                      <div class="d-flex flex-column h-100">
                        <div class="d-flex justify-space-between align-start mb-2">
                          <span class="text-body-2 font-weight-bold text-truncate" style="max-width: 100px;">
                            {{ config.description }}
                          </span>
                          <v-chip
                            size="x-small"
                            color="grey-darken-2"
                            variant="flat"
                          >
                            {{ key }}
                          </v-chip>
                        </div>
                        
                        <v-spacer />
                        
                        <!-- View Mode -->
                        <div v-if="!isEditMode" class="d-flex align-center justify-space-between">
                          <v-chip
                            color="success"
                            size="small"
                            variant="elevated"
                            class="font-weight-bold"
                          >
                            {{ config.value }}
                          </v-chip>
                          <span class="text-caption text-grey-darken-2">
                            {{ config.unit }}
                          </span>
                        </div>
                        
                        <!-- Edit Mode -->
                        <div v-else class="d-flex flex-column" style="min-height: 60px;">
                          <div class="d-flex align-center justify-space-between mb-1">
                            <v-text-field
                              v-model.number="editableConfigs[key].value"
                              type="number"
                              variant="outlined"
                              density="compact"
                              hide-details
                              :suffix="config.unit"
                              :color="isConfigChanged(key) ? 'warning' : 'primary'"
                              class="flex-grow-1"
                              style="max-width: calc(100% - 60px);"
                            />
                            <div class="d-flex align-center ml-1">
                              <v-icon
                                v-if="isConfigChanged(key)"
                                color="warning"
                                size="16"
                                class="mr-1"
                              >
                                mdi-pencil-circle
                              </v-icon>
                              <v-btn
                                v-if="isConfigChanged(key)"
                                icon
                                size="x-small"
                                color="warning"
                                variant="outlined"
                                @click="resetSingleConfig(key)"
                              >
                                <v-icon size="12">mdi-restore</v-icon>
                              </v-btn>
                            </div>
                          </div>
                          <!-- Reserve space for hint text to prevent layout shift -->
                          <div class="text-caption" style="min-height: 16px;">
                            <div v-if="isConfigChanged(key)" class="text-warning d-flex justify-space-between">
                              <span>เดิม: {{ originalConfigs[key]?.value }}</span>
                              <span>ใหม่: {{ editableConfigs[key].value }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { Device, DeviceConfig } from '~/data/devices'

interface Props {
  modelValue: boolean
  device: Device | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save' | 'toggleStatus'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const isEditMode = ref(false)
const editableConfigs = ref<Record<string, DeviceConfig>>({})
const originalConfigs = ref<Record<string, DeviceConfig>>({})

// Computed
const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const hasConfigChanges = computed(() => {
  return Object.keys(editableConfigs.value).some(key => isConfigChanged(key))
})

const configChangeCount = computed(() => {
  return Object.keys(editableConfigs.value).filter(key => isConfigChanged(key)).length
})

// Methods
const closeDialog = () => {
  showDialog.value = false
  isEditMode.value = false
  editableConfigs.value = {}
  originalConfigs.value = {}
}

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
  if (isEditMode.value && props.device) {
    editableConfigs.value = JSON.parse(JSON.stringify(props.device.configs.sale))
  }
}

const resetSingleConfig = (key: string) => {
  if (originalConfigs.value[key]) {
    editableConfigs.value[key] = JSON.parse(JSON.stringify(originalConfigs.value[key]))
  }
}

const isConfigChanged = (key: string) => {
  return originalConfigs.value[key]?.value !== editableConfigs.value[key]?.value
}

const getConfigCardColor = (key: string) => {
  if (!isEditMode.value) return 'white'
  return isConfigChanged(key) ? 'warning-lighten-4' : 'warning-lighten-5'
}

const getConfigCardClass = (key: string) => {
  const baseClass = isEditMode.value ? 'border-warning' : ''
  const changedClass = isEditMode.value && isConfigChanged(key) ? 'border-warning-darken-2' : ''
  return `${baseClass} ${changedClass}`.trim()
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "DEPLOYED":
      return "success";
    case "MAINTENANCE":
      return "warning";
    case "ERROR":
      return "error";
    default:
      return "grey";
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "DEPLOYED":
      return "ใช้งานได้";
    case "MAINTENANCE":
      return "บำรุงรักษา";
    case "ERROR":
      return "ขัดข้อง";
    default:
      return status;
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "WASH":
      return "primary";
    case "DRYING":
      return "secondary";
    default:
      return "grey";
  }
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case "WASH":
      return "เครื่องล้าง";
    case "DRYING":
      return "เครื่องอบแห้ง";
    default:
      return type;
  }
}

const getDeviceDescription = (type: string) => {
  switch (type) {
    case 'WASH':
      return 'เครื่องล้างรถอัตโนมัติที่มีระบบฉีดน้ำแรงดันสูง ระบบฟองสบู่ และการล้างด้วยแปรง นำมาใช้สำหรับทำความสะอาดรถยนต์และรถจักรยานยนต์อย่างมีประสิทธิภาพ'
    case 'DRYING':
      return 'เครื่องอบแห้งและฆ่าเชื้อโรคด้วยแสง UV และโอโซน เหมาะสำหรับการทำความสะอาดและฆ่าเชื้อโรคบนหมวกกันน็อค อุปกรณ์ป้องกัน และสิ่งของต่างๆ'
    default:
      return 'อุปกรณ์สำหรับบริการล้างและทำความสะอาด'
  }
}

// Watch for device changes to initialize configs
watch(() => props.device, (newDevice) => {
  if (newDevice) {
    originalConfigs.value = JSON.parse(JSON.stringify(newDevice.configs.sale))
    editableConfigs.value = JSON.parse(JSON.stringify(newDevice.configs.sale))
  }
}, { immediate: true })
</script>