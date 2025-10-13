<template>
  <div class="d-flex flex-column align-center justify-center pa-4">
    <!-- Welcome Section -->
    <div class="text-center mb-6">
      <v-avatar size="60" class="mb-4 gradient-avatar" color="transparent">
        <v-icon icon="mdi-key-outline" size="32" color="primary" />
      </v-avatar>

      <h1 class="text-h4 font-weight-bold gradient-text mb-2">ลืมรหัสผ่าน?</h1>

      <p class="text-body-2 text-medium-emphasis">
        กรุณาใส่อีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
      </p>
    </div>

    <!-- Vuetify Form Card -->
    <v-card class="w-100 glass-card" max-width="450" elevation="8" rounded="xl">
      <v-card-text class="pa-6">
        <v-form @submit.prevent="handleForgotPassword">
          <!-- Email Field -->
          <div class="mb-4">
            <v-label
              class="text-caption font-weight-medium text-uppercase mb-1"
            >
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
            :disabled="loading || !isFormValid"
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
import { ref, computed } from "vue";
import { emailRules } from "@/utils/validation-rules";

// Use auth layout
definePageMeta({
  layout: "auth",
});

// Reactive data
const email = ref("");
const loading = ref(false);

// Validation rules imported from common

// Form validation
const isFormValid = computed(() => {
  return (
    email.value.trim() !== "" &&
    email.value.includes("@") &&
    email.value.includes(".")
  );
});

// Methods
const handleForgotPassword = () => {
  loading.value = true;

  // TODO: Implement forgot password logic
  console.log("Forgot password request:", { email: email.value });

  // Simulate API call
  setTimeout(() => {
    loading.value = false;
    // TODO: Show success message and redirect
    console.log("Reset password email sent successfully");
  }, 1500);
};

const goToLogin = () => {
  // Navigate to login page
  navigateTo("/login");
};
</script>

<style scoped>
@import "@/assets/css/auth-common.css";
</style>
