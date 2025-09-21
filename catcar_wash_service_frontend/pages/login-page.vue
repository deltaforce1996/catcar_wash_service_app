<template>
  <div class="d-flex flex-column align-center justify-center pa-4">
    <!-- Welcome Section -->
    <div class="text-center mb-6">
      <v-avatar size="60" class="mb-4 gradient-avatar" color="transparent">
        <v-icon icon="mdi-paw" size="32" color="primary" />
      </v-avatar>

      <h1 class="text-h4 font-weight-bold gradient-text mb-2">
        ยินดีต้อนรับกลับมา!
      </h1>

      <p class="text-body-2 text-medium-emphasis">
        กรุณาลงชื่อเข้าใช้เพื่อเข้าสู่ระบบจัดการ Cat Car Wash
      </p>
    </div>

    <!-- Vuetify Form Card -->
    <v-card class="w-100 glass-card" max-width="450" elevation="8" rounded="xl">
      <v-card-text class="pa-6">
        <v-form @submit.prevent="handleLogin">
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

          <!-- Password Field -->
          <div class="mb-4">
            <v-label
              class="text-caption font-weight-medium text-uppercase mb-1"
            >
              รหัสผ่าน
            </v-label>
            <v-text-field
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              prepend-inner-icon="mdi-lock-outline"
              placeholder="กรุณาใส่รหัสผ่านของคุณ"
              :rules="passwordRules"
              hide-details="auto"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              class="mb-1"
              @click:append-inner="showPassword = !showPassword"
            />
          </div>

          <!-- Role Selection -->
          <div class="mb-4">
            <v-label
              class="text-caption font-weight-medium text-uppercase mb-1"
            >
              ประเภทบัญชี
            </v-label>
            <v-select
              v-model="role"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              prepend-inner-icon="mdi-account-outline"
              :items="[
                { title: 'ลูกค้า', value: 'USER' },
                { title: 'พนักงาน', value: 'EMP' },
              ]"
              hide-details="auto"
            />
          </div>

          <!-- Forgot Password -->
          <div class="d-flex justify-end mb-4">
            <v-btn
              variant="text"
              color="primary"
              size="small"
              class="text-caption"
              @click="forgotPassword"
            >
              ลืมรหัสผ่าน?
            </v-btn>
          </div>

          <!-- Success Alert -->
          <v-alert
            v-if="successMessage"
            type="success"
            variant="tonal"
            density="compact"
            rounded="lg"
            class="mb-4"
            closable
            @click:close="successMessage = null"
          >
            <template #prepend>
              <v-icon icon="mdi-check-circle" size="16" />
            </template>
            {{ successMessage }}
          </v-alert>

          <!-- Error Alert -->
          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            density="compact"
            rounded="lg"
            class="mb-4"
            closable
            @click:close="error = null"
          >
            {{ error }}
          </v-alert>

          <!-- Login Button -->
          <v-btn
            type="submit"
            block
            size="large"
            rounded="lg"
            class="gradient-btn text-none font-weight-bold mb-3"
            :loading="isLoading"
            :disabled="isLoading || !isFormValid"
            elevation="4"
          >
            <template #prepend>
              <v-icon icon="mdi-login" />
            </template>
            เข้าสู่ระบบ
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { emailRules, passwordRulesBasic } from "@/utils/validation-rules";
import { useAuth } from "~/composables/useAuth";

definePageMeta({
  layout: "auth",
});

const { login, isLoading, error, successMessage } = useAuth();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const role = ref<"USER" | "EMP">("USER");

const passwordRules = passwordRulesBasic;

const isFormValid = computed(() => {
  return (
    email.value.trim() !== "" &&
    password.value.trim() !== "" &&
    email.value.includes("@") &&
    password.value.length >= 6
  );
});

const handleLogin = async () => {
  try {
    await login(email.value, password.value, role.value);
    setTimeout(async () => {
      await navigateTo("/");
    }, 1500);
  } catch (err) {
    console.error("Login failed:", err);
  }
};

const forgotPassword = () => {
  navigateTo("/forgot-password");
};
</script>

<style scoped>
@import "@/assets/css/auth-common.css";
</style>
