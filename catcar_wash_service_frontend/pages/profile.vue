<template>
  <div>
    <!-- Header Section -->
    <div class="d-flex justify-space-between align-center flex-wrap mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">โปรไฟล์ผู้ใช้งาน</h1>
      </div>
      <div class="d-flex align-center ga-3 flex-wrap">
        <v-btn color="primary" prepend-icon="mdi-pencil" class="text-none">
          แก้ไขโปรไฟล์
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-cog" class="text-none">
          ตั้งค่าบัญชี
        </v-btn>
      </div>
    </div>

    <!-- Profile Hero Section -->
    <v-card color="surface-container" elevation="2" rounded="xl" class="mb-8">
      <v-card-text class="pa-8">
        <div class="d-flex flex-column flex-md-row align-center ga-6">
          <!-- Avatar -->
          <div class="text-center">
            <v-avatar size="120" class="elevation-4 mb-4">
              <v-img :src="profileData.avatar" alt="Profile Avatar" />
            </v-avatar>
            <v-chip
              :color="getStatusColor(profileData.status)"
              size="large"
              variant="tonal"
              class="font-weight-medium"
            >
              {{ getStatusLabel(profileData.status) }}
            </v-chip>
          </div>

          <!-- Basic Info -->
          <div class="flex-grow-1 text-center text-md-start">
            <h2 class="text-h4 font-weight-bold mb-2">
              {{ profileData.fullname }}
            </h2>
            <p class="text-h6 text-medium-emphasis mb-3">
              {{ profileData.custom_name }}
            </p>

            <!-- Quick Stats -->
            <div class="d-flex flex-wrap justify-center justify-md-start ga-4">
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-primary">
                  {{ profileData.device_counts.total }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  อุปกรณ์ทั้งหมด
                </div>
              </div>
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-success">
                  {{ profileData.device_counts.active }}
                </div>
                <div class="text-caption text-medium-emphasis">ใช้งานอยู่</div>
              </div>
              <div class="text-center">
                <div class="text-h5 font-weight-bold text-error">
                  {{ profileData.device_counts.inactive }}
                </div>
                <div class="text-caption text-medium-emphasis">หยุดใช้งาน</div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Information Cards -->
    <v-row>
      <v-col cols="12" lg="8">
        <!-- Personal Information Card -->
        <v-card
          color="surface-container"
          elevation="2"
          rounded="xl"
          class="mb-6"
        >
          <v-card-title class="pa-6">
            <div class="d-flex align-center">
              <v-icon color="primary" class="me-3">mdi-account-circle</v-icon>
              <span class="text-h5 font-weight-bold">ข้อมูลส่วนตัว</span>
            </div>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <v-row>
              <v-col cols="12" sm="6">
                <div class="mb-4">
                  <div class="text-caption text-medium-emphasis mb-1">
                    ชื่อ-นามสกุล
                  </div>
                  <div class="text-body-1 font-weight-medium">
                    {{ profileData.fullname }}
                  </div>
                </div>
                <div class="mb-4">
                  <div class="text-caption text-medium-emphasis mb-1">
                    อีเมล
                  </div>
                  <div class="text-body-1 font-weight-medium">
                    {{ profileData.email }}
                  </div>
                </div>
                <div class="mb-4">
                  <div class="text-caption text-medium-emphasis mb-1">
                    เบอร์โทรศัพท์
                  </div>
                  <div class="text-body-1 font-weight-medium">
                    {{ formatPhoneNumber(profileData.phone) }}
                  </div>
                </div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="mb-4">
                  <div class="text-caption text-medium-emphasis mb-1">
                    ชื่อเรียก/ชื่อร้าน
                  </div>
                  <div class="text-body-1 font-weight-medium">
                    {{ profileData.custom_name }}
                  </div>
                </div>
                <!-- <div class="mb-4">
                  <div class="text-caption text-medium-emphasis mb-1">รหัสลูกค้า</div>
                  <div class="text-body-1 font-weight-medium font-mono">{{ formatCustomerId(profileData.id) }}</div>
                </div> -->
              </v-col>
              <v-col cols="12">
                <div class="mb-4">
                  <div class="text-caption text-medium-emphasis mb-1">
                    ที่อยู่
                  </div>
                  <div class="text-body-1 font-weight-medium">
                    {{ profileData.address }}
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Account Status Card -->
        <v-card color="surface-container" elevation="2" rounded="xl">
          <v-card-title class="pa-6">
            <div class="d-flex align-center">
              <v-icon color="secondary" class="me-3">mdi-shield-check</v-icon>
              <span class="text-h5 font-weight-bold">สถานะบัญชี</span>
            </div>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <v-row>
              <v-col cols="12" sm="6">
                <div class="mb-4">
                  <div class="text-caption text-medium-emphasis mb-1">
                    สิทธิ์การใช้งาน
                  </div>
                  <v-chip
                    :color="getPermissionColor(profileData.permission.name)"
                    variant="tonal"
                    size="small"
                  >
                    {{ getPermissionLabel(profileData.permission.name) }}
                  </v-chip>
                </div>
                <div class="mb-4">
                  <div class="text-caption text-medium-emphasis mb-1">
                    วันที่สมัครสมาชิก
                  </div>
                  <div class="text-body-1 font-weight-medium">
                    {{ formatDate(profileData.created_at) }}
                  </div>
                </div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="mb-4">
                  <div class="text-caption text-medium-emphasis mb-1">
                    สถานะบัญชี
                  </div>
                  <v-chip
                    :color="getStatusColor(profileData.status)"
                    variant="tonal"
                    size="small"
                  >
                    {{ getStatusLabel(profileData.status) }}
                  </v-chip>
                </div>
                <div class="mb-4">
                  <div class="text-caption text-medium-emphasis mb-1">
                    อัปเดตล่าสุด
                  </div>
                  <div class="text-body-1 font-weight-medium">
                    {{ formatDate(profileData.updated_at) }}
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <!-- Device Statistics Card -->
        <v-card
          color="surface-container"
          elevation="2"
          rounded="xl"
          class="mb-6"
        >
          <v-card-title class="pa-6">
            <div class="d-flex align-center">
              <v-icon color="info" class="me-3">mdi-chart-donut</v-icon>
              <span class="text-h5 font-weight-bold">สถิติอุปกรณ์</span>
            </div>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <!-- Device Stats Visual -->
            <div class="text-center mb-6">
              <div class="text-h2 font-weight-bold text-primary mb-2">
                {{ profileData.device_counts.total }}
              </div>
              <div class="text-body-2 text-medium-emphasis">อุปกรณ์ทั้งหมด</div>
            </div>

            <!-- Device Breakdown -->
            <div class="mb-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="d-flex align-center">
                  <div class="device-status-dot bg-success me-2"></div>
                  <span class="text-body-2">ใช้งานอยู่</span>
                </div>
                <span class="text-body-2 font-weight-bold">{{
                  profileData.device_counts.active
                }}</span>
              </div>
              <v-progress-linear
                :model-value="
                  (profileData.device_counts.active /
                    profileData.device_counts.total) *
                  100
                "
                color="success"
                height="8"
                rounded
                class="mb-3"
              />
            </div>

            <div class="mb-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="d-flex align-center">
                  <div class="device-status-dot bg-error me-2"></div>
                  <span class="text-body-2">หยุดใช้งาน</span>
                </div>
                <span class="text-body-2 font-weight-bold">{{
                  profileData.device_counts.inactive
                }}</span>
              </div>
              <v-progress-linear
                :model-value="
                  (profileData.device_counts.inactive /
                    profileData.device_counts.total) *
                  100
                "
                color="error"
                height="8"
                rounded
              />
            </div>
          </v-card-text>
        </v-card>

        <!-- Quick Actions Card -->
        <v-card color="surface-container" elevation="2" rounded="xl">
          <v-card-title class="pa-6">
            <div class="d-flex align-center">
              <v-icon color="warning" class="me-3">mdi-lightning-bolt</v-icon>
              <span class="text-h5 font-weight-bold">การดำเนินการ</span>
            </div>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <div class="d-flex flex-column ga-3">
              <v-btn
                variant="outlined"
                prepend-icon="mdi-pencil"
                block
                class="text-none"
              >
                แก้ไขโปรไฟล์
              </v-btn>
              <v-btn
                variant="outlined"
                prepend-icon="mdi-lock"
                block
                class="text-none"
              >
                เปลี่ยนรหัสผ่าน
              </v-btn>
              <v-btn
                variant="outlined"
                prepend-icon="mdi-cog"
                block
                class="text-none"
              >
                ตั้งค่าบัญชี
              </v-btn>
              <v-divider class="my-2" />
              <v-btn
                variant="outlined"
                prepend-icon="mdi-logout"
                color="error"
                block
                class="text-none"
                @click="handleLogout"
              >
                ออกจากระบบ
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";

// Page metadata
definePageMeta({
  title: "โปรไฟล์ผู้ใช้งาน",
  layout: "default",
});

// Composables
const { logout } = useAuth();

// Mock user data from the JSON file
const profileData = {
  id: "cmfdx1e8l000azs30mrb4cmdh",
  fullname: "นางสาวสมหญิง รักดี",
  email: "user2@catcarwash.com",
  phone: "+66845678901",
  address: "789 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพมหานคร 10110",
  custom_name: "ลูกค้าธุรกิจ",
  status: "ACTIVE",
  created_at: "2025-09-10 18:48:17",
  updated_at: "2025-09-10 18:48:17",
  permission: { id: "cmfdx1e280002zs308j6qmm5l", name: "USER" },
  device_counts: { total: 4, active: 3, inactive: 1 },
  avatar: "/Character/character cat-02.png",
};

// Helper functions
const getStatusColor = (status: string) => {
  return status === "ACTIVE" ? "success" : "error";
};

const getStatusLabel = (status: string) => {
  return status === "ACTIVE" ? "ใช้งานอยู่" : "หยุดใช้งาน";
};

const getPermissionColor = (permission: string) => {
  switch (permission) {
    case "USER":
      return "info";
    case "TECHNICIAN":
      return "warning";
    case "ADMIN":
      return "primary";
    default:
      return "info";
  }
};

const getPermissionLabel = (permission: string) => {
  switch (permission) {
    case "USER":
      return "ผู้ใช้งานทั่วไป";
    case "TECHNICIAN":
      return "ช่างเทคนิค";
    case "ADMIN":
      return "ผู้ดูแลระบบ";
    default:
      return "ผู้ใช้งานทั่วไป";
  }
};

const formatPhoneNumber = (phone: string) => {
  // Format Thai phone number: +66834567890 -> +66 8 3456 7890
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("66")) {
    const countryCode = "+66";
    const number = cleaned.substring(2);
    return `${countryCode} ${number.substring(0, 1)} ${number.substring(
      1,
      5
    )} ${number.substring(5)}`;
  }
  return phone;
};

const formatCustomerId = (id: string) => {
  // Truncate and format customer ID for display
  return `${id.substring(0, 8)}...${id.substring(id.length - 4)}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const handleLogout = () => {
  logout();
  navigateTo("/login-page");
};
</script>

<style scoped>
.font-mono {
  font-family: "Courier New", monospace;
}

.device-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .text-h4 {
    font-size: 1.5rem !important;
  }
}

@media (max-width: 600px) {
  .v-card-text {
    padding: 1rem !important;
  }

  .v-card-title {
    padding: 1rem !important;
  }
}
</style>
