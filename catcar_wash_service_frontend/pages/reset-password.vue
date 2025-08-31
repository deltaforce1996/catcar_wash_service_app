<template>
  <div class="d-flex flex-column align-center justify-center pa-4">
    <!-- Welcome Section -->
    <div class="text-center mb-6">
      <v-avatar 
        size="60" 
        class="mb-4 gradient-avatar"
        color="transparent"
      >
        <v-icon icon="mdi-lock-reset" size="32" color="primary" />
      </v-avatar>
      
      <h1 class="text-h4 font-weight-bold gradient-text mb-2">
        รีเซ็ตรหัสผ่าน
      </h1>
      
      <p class="text-body-2 text-medium-emphasis">
        กรุณาใส่รหัสผ่านใหม่ของคุณเพื่อความปลอดภัย
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
        <v-form @submit.prevent="handleResetPassword">
          <!-- Password Field -->
          <div class="mb-4">
            <v-label class="text-caption font-weight-medium text-uppercase mb-1">
              รหัสผ่านใหม่
            </v-label>
            <v-text-field
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              prepend-inner-icon="mdi-lock-outline"
              placeholder="กรุณาใส่รหัสผ่านใหม่"
              :rules="passwordRules"
              hide-details="auto"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              class="mb-1"
              @click:append-inner="showPassword = !showPassword"
            />
          </div>

          <!-- Confirm Password Field -->
          <div class="mb-4">
            <v-label class="text-caption font-weight-medium text-uppercase mb-1">
              ยืนยันรหัสผ่าน
            </v-label>
            <v-text-field
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              prepend-inner-icon="mdi-lock-check-outline"
              placeholder="กรุณายืนยันรหัสผ่าน"
              :rules="confirmPasswordRules"
              hide-details="auto"
              :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
              class="mb-1"
              @click:append-inner="showConfirmPassword = !showConfirmPassword"
            />
          </div>

          <!-- Password Strength Indicator -->
          <div class="mb-4">
            <div class="text-caption text-medium-emphasis mb-2">ความแข็งแกร่งของรหัสผ่าน:</div>
            <v-progress-linear
              :model-value="passwordStrength"
              :color="passwordStrengthColor"
              height="6"
              rounded
              class="mb-2"
            />
            <div class="text-caption" :class="`text-${passwordStrengthColor}`">
              {{ passwordStrengthText }}
            </div>
          </div>

          <!-- Submit Button -->
          <v-btn
            type="submit"
            block
            size="large"
            rounded="lg"
            class="gradient-btn text-none font-weight-bold mb-4"
            :loading="loading"
            :disabled="loading || passwordStrength < 60"
            elevation="4"
          >
            <template #prepend>
              <v-icon icon="mdi-check-circle" />
            </template>
            รีเซ็ตรหัสผ่าน
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
              <span class="text-caption">กำลังรีเซ็ตรหัสผ่าน...</span>
            </div>
          </v-overlay>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Password Requirements -->
    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      rounded="lg"
      class="mt-4"
      max-width="450"
    >
      <template #prepend>
        <v-icon icon="mdi-shield-lock-outline" size="16" />
      </template>
      <div class="text-caption">
        <strong>รหัสผ่านต้องมี:</strong>
        <ul class="mt-1 ml-3">
          <li>อย่างน้อย 8 ตัวอักษร</li>
          <li>ตัวอักษรใหญ่และเล็ก</li>
          <li>ตัวเลขอย่างน้อย 1 ตัว</li>
        </ul>
      </div>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

// Use auth layout
definePageMeta({
  layout: "auth",
});

// Reactive data
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);

// Password strength calculation
const passwordStrength = computed(() => {
  const pwd = password.value;
  let strength = 0;
  
  if (pwd.length >= 8) strength += 20;
  if (pwd.length >= 12) strength += 10;
  if (/(?=.*[a-z])/.test(pwd)) strength += 20;
  if (/(?=.*[A-Z])/.test(pwd)) strength += 20;
  if (/(?=.*[0-9])/.test(pwd)) strength += 20;
  if (/(?=.*[!@#$%^&*])/.test(pwd)) strength += 10;
  
  return Math.min(strength, 100);
});

const passwordStrengthColor = computed(() => {
  if (passwordStrength.value < 40) return 'error';
  if (passwordStrength.value < 70) return 'warning';
  return 'success';
});

const passwordStrengthText = computed(() => {
  if (passwordStrength.value < 40) return 'อ่อนแอ';
  if (passwordStrength.value < 70) return 'ปานกลาง';
  return 'แข็งแกร่ง';
});

// Validation rules
const passwordRules = [
  (v: string) => !!v || "กรุณาใส่รหัสผ่าน",
  (v: string) => v.length >= 8 || "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
  (v: string) =>
    /(?=.*[a-z])/.test(v) || "รหัสผ่านต้องมีตัวอักษรเล็กอย่างน้อย 1 ตัว",
  (v: string) =>
    /(?=.*[A-Z])/.test(v) || "รหัสผ่านต้องมีตัวอักษรใหญ่อย่างน้อย 1 ตัว",
  (v: string) => /(?=.*[0-9])/.test(v) || "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว",
];

const confirmPasswordRules = computed(() => [
  (v: string) => !!v || "กรุณายืนยันรหัสผ่าน",
  (v: string) => v === password.value || "รหัสผ่านไม่ตรงกัน",
]);

// Methods
const handleResetPassword = () => {
  loading.value = true;

  // TODO: Implement reset password logic
  console.log("Reset password:", { password: password.value });

  // Simulate API call
  setTimeout(() => {
    loading.value = false;
    // TODO: Show success message and redirect to login
    console.log("Password reset successfully");
    // navigateTo('/login-page')
  }, 1500);
};

const goToLogin = () => {
  // Navigate to login page
  navigateTo("/login-page");
};
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

.gradient-btn:disabled {
  opacity: 0.6;
  transform: none !important;
  box-shadow: 0 4px 12px -2px rgba(245, 127, 42, 0.2) !important;
}

/* Dark Theme Adjustments */
.v-theme--dark .glass-card {
  background: rgba(var(--v-theme-surface), 0.8) !important;
  border-color: rgba(var(--v-theme-outline), 0.2) !important;
}
</style>
