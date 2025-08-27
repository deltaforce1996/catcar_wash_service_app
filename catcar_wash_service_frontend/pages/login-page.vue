<template>
  <div>
    <div class="text-center mb-6">
      <h2 class="text-h4 font-weight-bold mb-2">ยินดีต้อนรับกลับมา!</h2>
      <p class="text-body-1 text-grey-darken-1">
        กรุณาลงชื่อเข้าใช้เพื่อดำเนินการต่อ
      </p>
    </div>

    <v-form class="login-form" @submit.prevent="handleLogin">
      <v-text-field
        v-model="email"
        label="อีเมล"
        type="email"
        variant="outlined"
        prepend-inner-icon="mdi-email-outline"
        class="mb-5"
        :rules="emailRules"
        required
      />

      <v-text-field
        v-model="password"
        label="รหัสผ่าน"
        :type="showPassword ? 'text' : 'password'"
        variant="outlined"
        prepend-inner-icon="mdi-lock-outline"
        class="mb-2"
        :rules="passwordRules"
        required
        :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        @click:append-inner="showPassword = !showPassword"
      />

      <div class="d-flex justify-end align-center mb-5">
        <!-- <v-checkbox
        v-model="rememberMe"
        label="Remember me"
        color="orange"
        density="compact"
        hide-details
      /> -->
        <v-btn
          variant="text"
          color="orange"
          size="small"
          @click="forgotPassword"
        >
          ลืมรหัสผ่าน?
        </v-btn>
      </div>

      <v-btn
        type="submit"
        block
        size="large"
        class="mb-6 login-btn"
        :loading="loading"
        color="orange"
      >
        เข้าสู่ระบบ
      </v-btn>

      <!-- <div class="text-center">
      <p class="text-body-2 text-grey-darken-1">
        ยังไม่มีบัญชีใช่ไหม?
        <v-btn variant="text" color="orange" size="small" @click="goToSignUp">
          สมัครสมาชิก
        </v-btn>
      </p>
    </div> -->
    </v-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

// Use auth layout
definePageMeta({
  layout: "auth",
});

// Reactive data
const email = ref("");
const password = ref("");
const showPassword = ref(false);
// const rememberMe = ref(false)
const loading = ref(false);

// Validation rules
const emailRules = [
  (v: string) => !!v || "กรุณาใส่อีเมล",
  (v: string) => /.+@.+\..+/.test(v) || "รูปแบบอีเมลไม่ถูกต้อง",
];

const passwordRules = [
  (v: string) => !!v || "กรุณาใส่รหัสผ่าน",
  (v: string) => v.length >= 6 || "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
];

// Methods
const handleLogin = () => {
  loading.value = true;

  // TODO: Implement login logic
  console.log("Login attempt:", {
    email: email.value,
    password: password.value,
  });

  // Simulate API call
  setTimeout(() => {
    loading.value = false;
    // TODO: Navigate to dashboard or home page
    // navigateTo('/')
    console.log("Login successful - navigate to dashboard");
  }, 1500);
};

const forgotPassword = () => {
  // Navigate to forgot password page
  navigateTo("/forgot-password");
};

// const goToSignUp = () => {
//   // TODO: Navigate to sign up page
//   console.log("Go to sign up");
// };
</script>

<style scoped>
.login-form {
  width: 100%;
}

.login-btn {
  background: linear-gradient(45deg, #ff9800 30%, #ff5722 90%);
  box-shadow: 0 3px 5px 2px rgba(255, 152, 0, 0.3);
}

.login-btn:hover {
  background: linear-gradient(45deg, #f57c00 30%, #e64a19 90%);
}
</style>
