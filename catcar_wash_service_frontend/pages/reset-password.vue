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
            :disabled="loading || passwordStrength < 60 || !isFormValid"
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
import { 
  passwordRulesStrong, 
  createConfirmPasswordRules,
  calculatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthText
} from "@/utils/validation-rules";

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

// Password strength calculation using common functions
const passwordStrength = computed(() => calculatePasswordStrength(password.value));
const passwordStrengthColor = computed(() => getPasswordStrengthColor(passwordStrength.value));
const passwordStrengthText = computed(() => getPasswordStrengthText(passwordStrength.value));

// Validation rules using common functions
const passwordRules = passwordRulesStrong;
const confirmPasswordRules = computed(() => createConfirmPasswordRules(password.value));

// Form validation
const isFormValid = computed(() => {
  return password.value.trim() !== "" && 
         confirmPassword.value.trim() !== "" && 
         password.value === confirmPassword.value &&
         passwordStrength.value >= 60;
});

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
@import '@/assets/css/auth-common.css';
</style>
