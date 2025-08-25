<template>
  <div>
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary mb-2">
            จัดการลูกค้า
          </h1>
          <p class="text-body-1 text-grey-darken-1">
            จัดการข้อมูลลูกค้าและสมาชิก
          </p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-account-plus">
          เพิ่มลูกค้า
        </v-btn>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="ค้นหาลูกค้า..."
          variant="outlined"
          density="comfortable"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="selectedStatus"
          :items="statusOptions"
          label="สถานะ"
          variant="outlined"
          density="comfortable"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="selectedType"
          :items="typeOptions"
          label="ประเภท"
          variant="outlined"
          density="comfortable"
          hide-details
        />
      </v-col>
    </v-row>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="customers"
        :search="searchQuery"
        class="elevation-0"
      >
        <template #[`item.avatar`]="{ item }">
          <v-avatar size="40" class="my-2">
            <img v-if="item.avatar" :src="item.avatar" :alt="item.name">
            <v-icon v-else icon="mdi-account-circle" size="40" />
          </v-avatar>
        </template>

        <template #[`item.status`]="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            variant="flat"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <template #[`item.type`]="{ item }">
          <v-chip
            :color="getTypeColor(item.type)"
            size="small"
            variant="outlined"
          >
            {{ item.type }}
          </v-chip>
        </template>

        <template #[`item.totalSpent`]="{ item }">
          <span class="font-weight-medium">฿{{ item.totalSpent.toLocaleString() }}</span>
        </template>

        <template #[`item.actions`]="{ item }">
          <v-btn
            icon="mdi-eye"
            variant="text"
            size="small"
            @click="viewCustomer(item)"
          />
          <v-btn
            icon="mdi-pencil"
            variant="text"
            size="small"
            @click="editCustomer(item)"
          />
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            @click="deleteCustomer(item)"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  status: 'ใช้งาน' | 'ระงับ' | 'ปิดใช้งาน'
  type: 'ทั่วไป' | 'สมาชิก' | 'VIP'
  totalSpent: number
  lastVisit: string
}

// Search and filter states
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedType = ref('')

// Options for filters
const statusOptions = [
  { title: 'ทั้งหมด', value: '' },
  { title: 'ใช้งาน', value: 'ใช้งาน' },
  { title: 'ระงับ', value: 'ระงับ' },
  { title: 'ปิดใช้งาน', value: 'ปิดใช้งาน' }
]

const typeOptions = [
  { title: 'ทั้งหมด', value: '' },
  { title: 'ทั่วไป', value: 'ทั่วไป' },
  { title: 'สมาชิก', value: 'สมาชิก' },
  { title: 'VIP', value: 'VIP' }
]

// Table headers
const headers = [
  { title: '', key: 'avatar', sortable: false },
  { title: 'ชื่อ', key: 'name' },
  { title: 'อีเมล', key: 'email' },
  { title: 'เบอร์โทร', key: 'phone' },
  { title: 'สถานะ', key: 'status' },
  { title: 'ประเภท', key: 'type' },
  { title: 'ยอดใช้จ่าย', key: 'totalSpent' },
  { title: 'มาล่าสุด', key: 'lastVisit' },
  { title: 'จัดการ', key: 'actions', sortable: false }
]

// Mock customer data
const customers = ref<Customer[]>([
  {
    id: '1',
    name: 'สมชาย ใจดี',
    email: 'somchai@email.com',
    phone: '081-234-5678',
    status: 'ใช้งาน',
    type: 'สมาชิก',
    totalSpent: 2450,
    lastVisit: '2025-08-20'
  },
  {
    id: '2',
    name: 'สมหญิง รักสะอาด',
    email: 'somying@email.com',
    phone: '082-345-6789',
    status: 'ใช้งาน',
    type: 'VIP',
    totalSpent: 5680,
    lastVisit: '2025-08-21'
  },
  {
    id: '3',
    name: 'วิชัย ชอบเรียบร้อย',
    email: 'wichai@email.com',
    phone: '083-456-7890',
    status: 'ใช้งาน',
    type: 'ทั่วไป',
    totalSpent: 890,
    lastVisit: '2025-08-19'
  },
  {
    id: '4',
    name: 'มาลี สวยงาม',
    email: 'malee@email.com',
    phone: '084-567-8901',
    status: 'ระงับ',
    type: 'สมาชิก',
    totalSpent: 1200,
    lastVisit: '2025-08-15'
  },
  {
    id: '5',
    name: 'ประยุทธ์ รักความสะอาด',
    email: 'prayut@email.com',
    phone: '085-678-9012',
    status: 'ใช้งาน',
    type: 'VIP',
    totalSpent: 8900,
    lastVisit: '2025-08-21'
  }
])

// Methods
const getStatusColor = (status: string) => {
  switch (status) {
    case 'ใช้งาน': return 'success'
    case 'ระงับ': return 'warning'
    case 'ปิดใช้งาน': return 'error'
    default: return 'grey'
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'ทั่วไป': return 'primary'
    case 'สมาชิก': return 'info'
    case 'VIP': return 'warning'
    default: return 'grey'
  }
}

const viewCustomer = (customer: Customer) => {
  console.log('View customer:', customer)
}

const editCustomer = (customer: Customer) => {
  console.log('Edit customer:', customer)
}

const deleteCustomer = (customer: Customer) => {
  console.log('Delete customer:', customer)
}
</script>

<style scoped>
.v-data-table {
  background-color: transparent;
}
</style>