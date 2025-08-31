<template>
  <div class="d-flex flex-column align-center justify-center pa-4">
    <!-- Welcome Section -->
    <div class="text-center mb-6">
      <v-avatar 
        size="60" 
        class="mb-4 gradient-avatar"
        color="transparent"
      >
        <v-icon icon="mdi-key-outline" size="32" color="primary" />
      </v-avatar>
      
      <h1 class="text-h4 font-weight-bold gradient-text mb-2">
        ลืมรหัสผ่าน?
      </h1>
      
      <p class="text-body-2 text-medium-emphasis">
        กรุณาใส่อีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
      </p>
    </div>

    <!-- Vuetify Form Card -->
    <v-card
      class="w-100 glass-card"
      max-width="450"
      elevation="8"
      rounded="xl"
    >
      <v-card-text class="pa-6">
        <v-form @submit.prevent="handleForgotPassword">
          <!-- Email Field -->
          <div class="mb-4">
            <v-label class="text-caption font-weight-medium text-uppercase mb-1">
              อีเมล
            </v-label>
            <v-text-field
              v-model="email"
              type="email"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              prepend-inner-icon="mdi-email-outline"
              placeholder="กรุณาใส่อีเมลของคุณ"
              :rules="emailRules"
              hide-details="auto"
              class="mb-1"
            />
          </div>

          <!-- Submit Button -->
          <v-btn
            type="submit"
            block
            size="large"
            rounded="lg"
            class="gradient-btn text-none font-weight-bold mb-4"
            :loading="loading"
            :disabled="loading"
            elevation="4"
          >
            <template #prepend>
              <v-icon icon="mdi-email-fast" />
            </template>
            ส่งลิงก์รีเซ็ตรหัสผ่าน
          </v-btn>

          <!-- Back to Login -->
          <div class="text-center">
            <p class="text-body-2 text-medium-emphasis">
              จำรหัสผ่านได้แล้ว?
              <v-btn
                variant="text"
                color="primary"
                size="small"
                class="text-caption"
                @click="goToLogin"
              >
                เข้าสู่ระบบ
              </v-btn>
            </p>
          </div>

          <!-- Loading Overlay -->
          <v-overlay
            v-model="loading"
            contained
            class="align-center justify-center rounded-xl"
          >
            <div class="d-flex flex-column align-center">
              <v-progress-circular
                indeterminate
                size="32"
                width="3"
                color="primary"
                class="mb-2"
              />
              <span class="text-caption">กำลังส่งอีเมล...</span>
            </div>
          </v-overlay>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Security Notice -->
    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      rounded="lg"
      class="mt-4"
      max-width="450"
    >
      <template #prepend>
        <v-icon icon="mdi-information-outline" size="16" />
      </template>
      <span class="text-caption">
        เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณ ตรวจสอบโฟลเดอร์สแปมด้วย
      </span>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Use auth layout
definePageMeta({
  layout: 'auth'
})

// Reactive data
const email = ref('')
const loading = ref(false)

// Validation rules
const emailRules = [
  (v: string) => !!v || 'กรุณาใส่อีเมล',
  (v: string) => /.+@.+\..+/.test(v) || 'รูปแบบอีเมลไม่ถูกต้อง'
]

// Methods
const handleForgotPassword = () => {
  loading.value = true
  
  // TODO: Implement forgot password logic
  console.log('Forgot password request:', { email: email.value })
  
  // Simulate API call
  setTimeout(() => {
    loading.value = false
    // TODO: Show success message and redirect
    console.log('Reset password email sent successfully')
  }, 1500)
}

const goToLogin = () => {
  // Navigate to login page
  navigateTo('/login-page')
}
</script>

<style scoped>
/* Gradient Avatar Background */
.gradient-avatar {
  background: linear-gradient(135deg, rgba(245, 127, 42, 0.1), rgba(255, 152, 0, 0.1)) !important;
  border: 1px solid rgba(245, 127, 42, 0.2);
}

/* Gradient Text */
.gradient-text {
  background: linear-gradient(135deg, #f57f2a, #ff9800);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Glass Card Effect */
.glass-card {
  background: rgba(var(--v-theme-surface), 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--v-theme-outline), 0.1) !important;
}

.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(245, 127, 42, 0.3), transparent);
}

/* Gradient Button */
.gradient-btn {
  background: linear-gradient(135deg, #f57f2a, #ff9800) !important;
  color: white !important;
  position: relative;
  overflow: hidden;
}

.gradient-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.4s ease;
}

.gradient-btn:hover::before {
  left: 100%;
}

.gradient-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px -4px rgba(245, 127, 42, 0.4) !important;
}

/* Dark Theme Adjustments */
.v-theme--dark .glass-card {
  background: rgba(var(--v-theme-surface), 0.8) !important;
  border-color: rgba(var(--v-theme-outline), 0.2) !important;
}
</style>