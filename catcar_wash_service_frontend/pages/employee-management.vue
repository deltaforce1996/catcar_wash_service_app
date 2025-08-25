<template>
  <div>
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary mb-2">
            จัดการพนักงาน
          </h1>
          <p class="text-body-1 text-grey-darken-1">
            จัดการข้อมูลพนักงานและสิทธิการเข้าถึงระบบ
          </p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openAddDialog">
          เพิ่มพนักงาน
        </v-btn>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="ค้นหาพนักงาน..."
          variant="outlined"
          density="comfortable"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="selectedDepartment"
          :items="departmentOptions"
          label="แผนก"
          variant="outlined"
          density="comfortable"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="selectedRole"
          :items="roleOptions"
          label="ตำแหน่ง"
          variant="outlined"
          density="comfortable"
          hide-details
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="employee in filteredEmployees"
        :key="employee.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="employee-card">
          <v-card-text class="text-center">
            <v-avatar size="80" class="mb-3">
              <img v-if="employee.avatar" :src="employee.avatar" :alt="employee.name">
              <v-icon v-else icon="mdi-account-circle" size="80" />
            </v-avatar>
            
            <div class="mb-2">
              <h3 class="text-h6 font-weight-bold">{{ employee.name }}</h3>
              <p class="text-body-2 text-grey-darken-1">{{ employee.position }}</p>
            </div>
            
            <v-chip
              :color="getRoleColor(employee.role)"
              size="small"
              variant="flat"
              class="mb-2"
            >
              {{ employee.role }}
            </v-chip>
            
            <div class="employee-details">
              <div class="detail-item">
                <v-icon icon="mdi-domain" size="16" class="me-2" />
                <span>{{ employee.department }}</span>
              </div>
              <div class="detail-item">
                <v-icon icon="mdi-email-outline" size="16" class="me-2" />
                <span>{{ employee.email }}</span>
              </div>
              <div class="detail-item">
                <v-icon icon="mdi-phone" size="16" class="me-2" />
                <span>{{ employee.phone }}</span>
              </div>
              <div class="detail-item">
                <v-icon icon="mdi-calendar" size="16" class="me-2" />
                <span>เริ่มงาน: {{ employee.startDate }}</span>
              </div>
            </div>
          </v-card-text>
          
          <v-card-actions class="justify-center">
            <v-btn variant="text" size="small" @click="viewEmployee(employee)">
              ดูรายละเอียด
            </v-btn>
            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="small" />
              </template>
              <v-list>
                <v-list-item @click="editEmployee(employee)">
                  <v-list-item-title>แก้ไข</v-list-item-title>
                </v-list-item>
                <v-list-item @click="managePermissions(employee)">
                  <v-list-item-title>จัดการสิทธิ์</v-list-item-title>
                </v-list-item>
                <v-list-item @click="resetPassword(employee)">
                  <v-list-item-title>รีเซ็ตรหัสผ่าน</v-list-item-title>
                </v-list-item>
                <v-list-item :class="employee.isActive ? 'text-warning' : 'text-success'" @click="toggleEmployee(employee)">
                  <v-list-item-title>{{ employee.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }}</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item class="text-error" @click="deleteEmployee(employee)">
                  <v-list-item-title>ลบ</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add/Edit Employee Dialog -->
    <v-dialog v-model="employeeDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ isEditing ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="employeeForm">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="currentEmployee.name"
                  label="ชื่อ-นามสกุล"
                  variant="outlined"
                  :rules="[v => !!v || 'กรุณาใส่ชื่อ']"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="currentEmployee.position"
                  label="ตำแหน่ง"
                  variant="outlined"
                  :rules="[v => !!v || 'กรุณาใส่ตำแหน่ง']"
                  required
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-select
                  v-model="currentEmployee.department"
                  :items="departments"
                  label="แผนก"
                  variant="outlined"
                  :rules="[v => !!v || 'กรุณาเลือกแผนก']"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="currentEmployee.role"
                  :items="roles"
                  label="บทบาท"
                  variant="outlined"
                  :rules="[v => !!v || 'กรุณาเลือกบทบาท']"
                  required
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="currentEmployee.email"
                  label="อีเมล"
                  type="email"
                  variant="outlined"
                  :rules="[v => !!v || 'กรุณาใส่อีเมล', v => /.+@.+\..+/.test(v) || 'รูปแบบอีเมลไม่ถูกต้อง']"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="currentEmployee.phone"
                  label="เบอร์โทร"
                  variant="outlined"
                  :rules="[v => !!v || 'กรุณาใส่เบอร์โทร']"
                  required
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="currentEmployee.startDate"
                  label="วันที่เริ่มงาน"
                  type="date"
                  variant="outlined"
                  :rules="[v => !!v || 'กรุณาใส่วันที่เริ่มงาน']"
                  required
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="currentEmployee.salary"
                  label="เงินเดือน (บาท)"
                  type="number"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeEmployeeDialog">ยกเลิก</v-btn>
          <v-btn color="primary" @click="saveEmployee">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Employee {
  id: string
  name: string
  position: string
  department: string
  role: 'Admin' | 'Manager' | 'Operator' | 'Technician'
  email: string
  phone: string
  startDate: string
  salary?: number
  isActive: boolean
  avatar?: string
}

// States
const searchQuery = ref('')
const selectedDepartment = ref('')
const selectedRole = ref('')
const employeeDialog = ref(false)
const isEditing = ref(false)
const employeeForm = ref()

// Current employee for add/edit
const currentEmployee = ref<Employee>({
  id: '',
  name: '',
  position: '',
  department: '',
  role: 'Operator',
  email: '',
  phone: '',
  startDate: '',
  isActive: true
})

// Options
const departmentOptions = [
  { title: 'ทั้งหมด', value: '' },
  { title: 'ปฏิบัติการ', value: 'ปฏิบัติการ' },
  { title: 'เทคนิค', value: 'เทคนิค' },
  { title: 'การเงิน', value: 'การเงิน' },
  { title: 'บริหาร', value: 'บริหาร' }
]

const roleOptions = [
  { title: 'ทั้งหมด', value: '' },
  { title: 'Admin', value: 'Admin' },
  { title: 'Manager', value: 'Manager' },
  { title: 'Operator', value: 'Operator' },
  { title: 'Technician', value: 'Technician' }
]

const departments = ['ปฏิบัติการ', 'เทคนิค', 'การเงิน', 'บริหาร']
const roles = ['Admin', 'Manager', 'Operator', 'Technician']

// Mock employee data
const employees = ref<Employee[]>([
  {
    id: '1',
    name: 'สมชาย ใจดี',
    position: 'ผู้จัดการทั่วไป',
    department: 'บริหาร',
    role: 'Admin',
    email: 'somchai@catcarwash.com',
    phone: '081-234-5678',
    startDate: '2024-01-15',
    salary: 35000,
    isActive: true
  },
  {
    id: '2',
    name: 'สมหญิง รักสะอาด',
    position: 'หัวหน้าฝ่ายปฏิบัติการ',
    department: 'ปฏิบัติการ',
    role: 'Manager',
    email: 'somying@catcarwash.com',
    phone: '082-345-6789',
    startDate: '2024-02-01',
    salary: 28000,
    isActive: true
  },
  {
    id: '3',
    name: 'วิชัย ช่างซ่อม',
    position: 'ช่างเทคนิค',
    department: 'เทคนิค',
    role: 'Technician',
    email: 'wichai@catcarwash.com',
    phone: '083-456-7890',
    startDate: '2024-03-15',
    salary: 22000,
    isActive: true
  },
  {
    id: '4',
    name: 'มาลี ขยันทำงาน',
    position: 'พนักงานปฏิบัติการ',
    department: 'ปฏิบัติการ',
    role: 'Operator',
    email: 'malee@catcarwash.com',
    phone: '084-567-8901',
    startDate: '2024-04-01',
    salary: 18000,
    isActive: false
  },
  {
    id: '5',
    name: 'ประยุทธ์ คิดเลข',
    position: 'เจ้าหน้าที่การเงิน',
    department: 'การเงิน',
    role: 'Manager',
    email: 'prayut@catcarwash.com',
    phone: '085-678-9012',
    startDate: '2024-05-01',
    salary: 25000,
    isActive: true
  }
])

// Computed filtered employees
const filteredEmployees = computed(() => {
  return employees.value.filter(employee => {
    const matchesSearch = !searchQuery.value || 
      employee.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesDepartment = !selectedDepartment.value || 
      employee.department === selectedDepartment.value
    
    const matchesRole = !selectedRole.value || 
      employee.role === selectedRole.value
    
    return matchesSearch && matchesDepartment && matchesRole
  })
})

// Methods
const getRoleColor = (role: string) => {
  switch (role) {
    case 'Admin': return 'error'
    case 'Manager': return 'warning'
    case 'Operator': return 'info'
    case 'Technician': return 'success'
    default: return 'grey'
  }
}

const openAddDialog = () => {
  currentEmployee.value = {
    id: '',
    name: '',
    position: '',
    department: '',
    role: 'Operator',
    email: '',
    phone: '',
    startDate: '',
    isActive: true
  }
  isEditing.value = false
  employeeDialog.value = true
}

const closeEmployeeDialog = () => {
  employeeDialog.value = false
  employeeForm.value?.reset()
}

const saveEmployee = async () => {
  const result = await employeeForm.value?.validate()
  if (!result?.valid) return
  if (!valid) return
  
  if (isEditing.value) {
    const index = employees.value.findIndex(e => e.id === currentEmployee.value.id)
    if (index !== -1) {
      employees.value[index] = { ...currentEmployee.value }
    }
  } else {
    currentEmployee.value.id = Date.now().toString()
    employees.value.push({ ...currentEmployee.value })
  }
  
  closeEmployeeDialog()
}

const viewEmployee = (employee: Employee) => {
  console.log('View employee:', employee)
}

const editEmployee = (employee: Employee) => {
  currentEmployee.value = { ...employee }
  isEditing.value = true
  employeeDialog.value = true
}

const managePermissions = (employee: Employee) => {
  console.log('Manage permissions for:', employee)
}

const resetPassword = (employee: Employee) => {
  console.log('Reset password for:', employee)
}

const toggleEmployee = (employee: Employee) => {
  const index = employees.value.findIndex(e => e.id === employee.id)
  if (index !== -1) {
    employees.value[index].isActive = !employees.value[index].isActive
  }
}

const deleteEmployee = (employee: Employee) => {
  const index = employees.value.findIndex(e => e.id === employee.id)
  if (index !== -1) {
    employees.value.splice(index, 1)
  }
}
</script>

<style scoped>
.employee-card {
  height: 100%;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.employee-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.employee-details {
  text-align: left;
  margin-top: 1rem;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>