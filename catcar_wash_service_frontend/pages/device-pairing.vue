<template>
  <div>
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold text-primary mb-2">
          จับคู่อุปกรณ์
        </h1>
        <p class="text-body-1 text-grey-darken-1">
          จับคู่และเชื่อมต่ออุปกรณ์เครื่องล้างรถกับระบบ
        </p>
      </v-col>
    </v-row>

    <v-row>
      <!-- Available Devices -->
      <v-col cols="12" md="5">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-wifi-off" class="me-2" />
            อุปกรณ์ที่ยังไม่ได้เชื่อมต่อ
            <v-spacer />
            <v-btn
              icon="mdi-refresh"
              variant="text"
              size="small"
              :loading="scanning"
              @click="scanDevices"
            />
          </v-card-title>
          
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="device in availableDevices"
                :key="device.id"
                :title="device.name"
                :subtitle="`MAC: ${device.macAddress} | Signal: ${device.signalStrength}%`"
                :prepend-icon="getDeviceIcon(device.type)"
                class="available-device"
                :class="{ 'selected': selectedDevice?.id === device.id }"
                @click="selectDevice(device)"
              >
                <template #append>
                  <v-chip
                    :color="getSignalColor(device.signalStrength)"
                    size="small"
                    variant="flat"
                  >
                    {{ device.signalStrength }}%
                  </v-chip>
                </template>
              </v-list-item>
              
              <v-list-item v-if="availableDevices.length === 0" class="text-center">
                <v-list-item-title class="text-grey-darken-1">
                  ไม่พบอุปกรณ์ที่สามารถเชื่อมต่อได้
                </v-list-item-title>
                <v-list-item-subtitle>
                  กดปุ่มสแกนเพื่อค้นหาอุปกรณ์ใหม่
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Pairing Controls -->
      <v-col cols="12" md="2">
        <div class="h-100 d-flex flex-column align-center justify-center">
          <v-btn
            color="primary"
            size="large"
            class="mb-4"
            :disabled="!selectedDevice"
            :loading="pairing"
            @click="pairDevice"
          >
            <v-icon icon="mdi-arrow-right" size="24" />
          </v-btn>
          
          <v-divider class="my-4" />
          
          <v-btn
            color="warning"
            size="large"
            :disabled="!selectedPairedDevice"
            :loading="unpairing"
            @click="unpairDevice"
          >
            <v-icon icon="mdi-arrow-left" size="24" />
          </v-btn>
        </div>
      </v-col>

      <!-- Paired Devices -->
      <v-col cols="12" md="5">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-wifi" class="me-2" />
            อุปกรณ์ที่เชื่อมต่อแล้ว
          </v-card-title>
          
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="device in pairedDevices"
                :key="device.id"
                :title="device.name"
                :subtitle="`ตำแหน่ง: ${device.location} | สถานะ: ${device.status}`"
                :prepend-icon="getDeviceIcon(device.type)"
                class="paired-device"
                :class="{ 'selected': selectedPairedDevice?.id === device.id }"
                @click="selectPairedDevice(device)"
              >
                <template #append>
                  <v-menu>
                    <template #activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="small" />
                    </template>
                    <v-list>
                      <v-list-item @click="configureDevice(device)">
                        <v-list-item-title>ตั้งค่า</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="testDevice(device)">
                        <v-list-item-title>ทดสอบ</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="viewLogs(device)">
                        <v-list-item-title>ดู Log</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </template>
              </v-list-item>
              
              <v-list-item v-if="pairedDevices.length === 0" class="text-center">
                <v-list-item-title class="text-grey-darken-1">
                  ยังไม่มีอุปกรณ์ที่เชื่อมต่อ
                </v-list-item-title>
                <v-list-item-subtitle>
                  เลือกอุปกรณ์จากด้านซ้ายเพื่อจับคู่
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Device Configuration Dialog -->
    <v-dialog v-model="configDialog" max-width="500">
      <v-card v-if="configDevice">
        <v-card-title>ตั้งค่าอุปกรณ์: {{ configDevice.name }}</v-card-title>
        
        <v-card-text>
          <v-form>
            <v-text-field
              v-model="configDevice.location"
              label="ตำแหน่งติดตั้ง"
              variant="outlined"
              class="mb-4"
            />
            
            <v-select
              v-model="configDevice.washType"
              :items="washTypes"
              label="ประเภทการล้าง"
              variant="outlined"
              class="mb-4"
            />
            
            <v-text-field
              v-model="configDevice.pricePerUse"
              label="ราคาต่อครั้ง (บาท)"
              type="number"
              variant="outlined"
              class="mb-4"
            />
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="configDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="saveDeviceConfig">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Device {
  id: string
  name: string
  macAddress: string
  type: 'washing-machine' | 'payment-terminal' | 'sensor'
  signalStrength?: number
  location?: string
  status?: string
  washType?: string
  pricePerUse?: number
}

// States
const scanning = ref(false)
const pairing = ref(false)
const unpairing = ref(false)
const configDialog = ref(false)
const selectedDevice = ref<Device | null>(null)
const selectedPairedDevice = ref<Device | null>(null)
const configDevice = ref<Device | null>(null)

// Mock data
const availableDevices = ref<Device[]>([
  {
    id: 'dev_001',
    name: 'CarWash Pro X1',
    macAddress: 'AA:BB:CC:DD:EE:01',
    type: 'washing-machine',
    signalStrength: 85
  },
  {
    id: 'dev_002',
    name: 'Payment Terminal PT-200',
    macAddress: 'AA:BB:CC:DD:EE:02',
    type: 'payment-terminal',
    signalStrength: 72
  },
  {
    id: 'dev_003',
    name: 'Smart Sensor S1',
    macAddress: 'AA:BB:CC:DD:EE:03',
    type: 'sensor',
    signalStrength: 91
  }
])

const pairedDevices = ref<Device[]>([
  {
    id: 'paired_001',
    name: 'CarWash Pro X2',
    macAddress: 'AA:BB:CC:DD:EE:04',
    type: 'washing-machine',
    location: 'จุดที่ A1',
    status: 'ใช้งานได้',
    washType: 'ล้างธรรมดา',
    pricePerUse: 50
  },
  {
    id: 'paired_002',
    name: 'CarWash Pro X3',
    macAddress: 'AA:BB:CC:DD:EE:05',
    type: 'washing-machine',
    location: 'จุดที่ A2',
    status: 'กำลังใช้งาน',
    washType: 'ล้างพิเศษ',
    pricePerUse: 80
  }
])

const washTypes = [
  'ล้างธรรมดา',
  'ล้างพิเศษ',
  'ล้างแว็กซ์',
  'ล้างระดับ Premium'
]

// Methods
const scanDevices = async () => {
  scanning.value = true
  // Simulate scanning delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  // Add new mock device
  const newDevice: Device = {
    id: `dev_${Date.now()}`,
    name: `New Device ${Math.floor(Math.random() * 100)}`,
    macAddress: `BB:CC:DD:EE:FF:${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
    type: 'washing-machine',
    signalStrength: Math.floor(Math.random() * 40) + 60
  }
  availableDevices.value.push(newDevice)
  scanning.value = false
}

const selectDevice = (device: Device) => {
  selectedDevice.value = device
}

const selectPairedDevice = (device: Device) => {
  selectedPairedDevice.value = device
}

const pairDevice = async () => {
  if (!selectedDevice.value) return
  
  pairing.value = true
  // Simulate pairing delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Move device from available to paired
  const device = { ...selectedDevice.value }
  device.location = 'ยังไม่ได้กำหนด'
  device.status = 'ใช้งานได้'
  device.washType = 'ล้างธรรมดา'
  device.pricePerUse = 50
  
  pairedDevices.value.push(device)
  availableDevices.value = availableDevices.value.filter(d => d.id !== device.id)
  selectedDevice.value = null
  pairing.value = false
}

const unpairDevice = async () => {
  if (!selectedPairedDevice.value) return
  
  unpairing.value = true
  // Simulate unpairing delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Move device from paired to available
  const device = { ...selectedPairedDevice.value }
  delete device.location
  delete device.status
  delete device.washType
  delete device.pricePerUse
  device.signalStrength = Math.floor(Math.random() * 40) + 60
  
  availableDevices.value.push(device)
  pairedDevices.value = pairedDevices.value.filter(d => d.id !== device.id)
  selectedPairedDevice.value = null
  unpairing.value = false
}

const getDeviceIcon = (type: string) => {
  switch (type) {
    case 'washing-machine': return 'mdi-washing-machine'
    case 'payment-terminal': return 'mdi-credit-card'
    case 'sensor': return 'mdi-radar'
    default: return 'mdi-devices'
  }
}

const getSignalColor = (strength: number) => {
  if (strength >= 80) return 'success'
  if (strength >= 60) return 'warning'
  return 'error'
}

const configureDevice = (device: Device) => {
  configDevice.value = { ...device }
  configDialog.value = true
}

const saveDeviceConfig = () => {
  if (configDevice.value) {
    const index = pairedDevices.value.findIndex(d => d.id === configDevice.value!.id)
    if (index !== -1) {
      pairedDevices.value[index] = { ...configDevice.value }
    }
  }
  configDialog.value = false
  configDevice.value = null
}

const testDevice = (device: Device) => {
  console.log('Test device:', device)
}

const viewLogs = (device: Device) => {
  console.log('View logs for device:', device)
}
</script>

<style scoped>
.available-device,
.paired-device {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.available-device:hover,
.paired-device:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.available-device.selected,
.paired-device.selected {
  background-color: rgba(var(--v-theme-primary), 0.2);
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.h-100 {
  height: 100%;
}
</style>