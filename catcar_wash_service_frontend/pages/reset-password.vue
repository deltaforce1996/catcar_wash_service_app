<template>
  <div>
    <div class="text-center mb-6">
      <h2 class="text-h4 font-weight-bold mb-2">รีเซ็ตรหัสผ่าน</h2>
      <p class="text-body-1 text-grey-darken-1">กรุณาใส่รหัสผ่านใหม่ของคุณ</p>
    </div>

    <v-form class="reset-password-form" @submit.prevent="handleResetPassword">
      <v-text-field
        v-model="password"
        label="รหัสผ่านใหม่"
        :type="showPassword ? 'text' : 'password'"
        variant="outlined"
        prepend-inner-icon="mdi-lock-outline"
        class="mb-4"
        :rules="passwordRules"
        required
        :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        @click:append-inner="showPassword = !showPassword"
      />

      <v-text-field
        v-model="confirmPassword"
        label="ยืนยันรหัสผ่าน"
        :type="showConfirmPassword ? 'text' : 'password'"
        variant="outlined"
        prepend-inner-icon="mdi-lock-outline"
        class="mb-5"
        :rules="confirmPasswordRules"
        required
        :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
        @click:append-inner="showConfirmPassword = !showConfirmPassword"
      />

      <v-btn
        type="submit"
        block
        size="large"
        class="mb-6 submit-btn"
        :loading="loading"
        color="orange"
      >
        รีเซ็ตรหัสผ่าน
      </v-btn>

      <div class="text-center">
        <p class="text-body-2 text-grey-darken-1">
          จำรหัสผ่านได้แล้ว?
          <v-btn variant="text" color="orange" size="small" @click="goToLogin">
            เข้าสู่ระบบ
          </v-btn>
        </p>
      </div>
    </v-form>
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
.reset-password-form {
  width: 100%;
}

.submit-btn {
  background: linear-gradient(45deg, #ff9800 30%, #ff5722 90%);
  box-shadow: 0 3px 5px 2px rgba(255, 152, 0, 0.3);
}

.submit-btn:hover {
  background: linear-gradient(45deg, #f57c00 30%, #e64a19 90%);
}
</style>
