<template>
  <div>
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary mb-2">
            จัดการอุปกรณ์
          </h1>
          <p class="text-body-1 text-grey-darken-1">
            จัดการและตรวจสอบสถานะเครื่องล้างรถทั้งหมด
          </p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-plus">
          เพิ่มอุปกรณ์
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="device in devices"
        :key="device.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="device-card" :color="getDeviceStatusColor(device.status)">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>{{ device.name }}</span>
            <v-chip
              :color="getStatusChipColor(device.status)"
              size="small"
              variant="flat"
            >
              {{ device.status }}
            </v-chip>
          </v-card-title>
          
          <v-card-text>
            <div class="mb-2">
              <v-icon icon="mdi-map-marker" size="16" class="me-1" />
              {{ device.location }}
            </div>
            <div class="mb-2">
              <v-icon icon="mdi-currency-thb" size="16" class="me-1" />
              ยอดขายวันนี้: {{ device.dailyRevenue }}
            </div>
            <div class="mb-2">
              <v-icon icon="mdi-counter" size="16" class="me-1" />
              ใช้งาน: {{ device.usageCount }} ครั้ง
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn variant="text" size="small" @click="viewDevice(device)">
              ดูรายละเอียด
            </v-btn>
            <v-spacer />
            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="small" />
              </template>
              <v-list>
                <v-list-item @click="editDevice(device)">
                  <v-list-item-title>แก้ไข</v-list-item-title>
                </v-list-item>
                <v-list-item @click="maintenanceDevice(device)">
                  <v-list-item-title>บำรุงรักษา</v-list-item-title>
                </v-list-item>
                <v-list-item class="text-error" @click="deleteDevice(device)">
                  <v-list-item-title>ลบ</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Device {
  id: string
  name: string
  location: string
  status: 'ใช้งานได้' | 'กำลังใช้งาน' | 'บำรุงรักษา' | 'ขัดข้อง'
  dailyRevenue: string
  usageCount: number
}

// Mock data for devices
const devices = ref<Device[]>([
  {
    id: '1',
    name: 'เครื่องที่ 1',
    location: 'จุดที่ A1',
    status: 'ใช้งานได้',
    dailyRevenue: '1,250',
    usageCount: 15
  },
  {
    id: '2',
    name: 'เครื่องที่ 2',
    location: 'จุดที่ A2',
    status: 'กำลังใช้งาน',
    dailyRevenue: '980',
    usageCount: 12
  },
  {
    id: '3',
    name: 'เครื่องที่ 3',
    location: 'จุดที่ B1',
    status: 'บำรุงรักษา',
    dailyRevenue: '0',
    usageCount: 0
  },
  {
    id: '4',
    name: 'เครื่องที่ 4',
    location: 'จุดที่ B2',
    status: 'ใช้งานได้',
    dailyRevenue: '1,480',
    usageCount: 18
  },
  {
    id: '5',
    name: 'เครื่องที่ 5',
    location: 'จุดที่ C1',
    status: 'ขัดข้อง',
    dailyRevenue: '320',
    usageCount: 4
  },
  {
    id: '6',
    name: 'เครื่องที่ 6',
    location: 'จุดที่ C2',
    status: 'ใช้งานได้',
    dailyRevenue: '1,680',
    usageCount: 21
  }
])

// Methods
const getDeviceStatusColor = (status: string) => {
  switch (status) {
    case 'ใช้งานได้': return 'surface'
    case 'กำลังใช้งาน': return 'info'
    case 'บำรุงรักษา': return 'warning'
    case 'ขัดข้อง': return 'error'
    default: return 'surface'
  }
}

const getStatusChipColor = (status: string) => {
  switch (status) {
    case 'ใช้งานได้': return 'success'
    case 'กำลังใช้งาน': return 'info'
    case 'บำรุงรักษา': return 'warning'
    case 'ขัดข้อง': return 'error'
    default: return 'grey'
  }
}

const viewDevice = (device: Device) => {
  console.log('View device:', device)
}

const editDevice = (device: Device) => {
  console.log('Edit device:', device)
}

const maintenanceDevice = (device: Device) => {
  console.log('Maintenance device:', device)
}

const deleteDevice = (device: Device) => {
  console.log('Delete device:', device)
}
</script>

<style scoped>
.device-card {
  height: 100%;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.device-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
</style>