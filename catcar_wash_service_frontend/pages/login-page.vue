<template>
  <v-app>
    <v-container fluid class="pa-0" style="height: 100vh">
    <v-row no-gutters style="height: 100%">
      <!-- Left Side - Image with Gradient -->
      <v-col cols="12" md="6" class="d-none d-md-flex">
        <div class="image-section">
          <div class="gradient-overlay">
            <div class="content-overlay">
              <div class="brand-section">
                <img
                  class="brand-logo"
                  src="/Logo/CCW LOGO-02-white-text.png"
                  alt="CAT CARWASH Logo"
                >
              </div>
            </div>
          </div>
        </div>
      </v-col>

      <!-- Right Side - Login Form -->
      <v-col cols="12" md="6" class="d-flex align-center justify-center">
        <div class="login-form-container">
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

            <div class="text-center">
              <p class="text-body-2 text-grey-darken-1">
                ยังไม่มีบัญชีใช่ไหม?
                <v-btn
                  variant="text"
                  color="orange"
                  size="small"
                  @click="goToSignUp"
                >
                  สมัครสมาชิก
                </v-btn>
              </p>
            </div>
          </v-form>
        </div>
      </v-col>
    </v-row>
    </v-container>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Disable layout for this page
definePageMeta({
  layout: false
})

// Reactive data
const email = ref('')
const password = ref('')
const showPassword = ref(false)
// const rememberMe = ref(false)
const loading = ref(false)

// Validation rules
const emailRules = [
  (v: string) => !!v || 'กรุณาใส่อีเมล',
  (v: string) => /.+@.+\..+/.test(v) || 'รูปแบบอีเมลไม่ถูกต้อง'
]

const passwordRules = [
  (v: string) => !!v || 'กรุณาใส่รหัสผ่าน',
  (v: string) => v.length >= 6 || 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
]

// Methods
const handleLogin = () => {
  loading.value = true
  
  // TODO: Implement login logic
  console.log('Login attempt:', { email: email.value, password: password.value })
  
  // Simulate API call
  setTimeout(() => {
    loading.value = false
    // TODO: Navigate to dashboard or home page
    // navigateTo('/')
    console.log('Login successful - navigate to dashboard')
  }, 1500)
}

const forgotPassword = () => {
  // TODO: Implement forgot password functionality
  console.log('Forgot password clicked')
}

const goToSignUp = () => {
  // TODO: Navigate to sign up page
  console.log('Go to sign up')
}
</script>

<style scoped>
.image-section {
  position: relative;
  width: 100%;
  height: 100%;
  background-image: url('/shop-cat-100-2.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 152, 0, 0.9) 0%,
    rgba(255, 193, 7, 0.8) 50%,
    rgba(255, 87, 34, 0.9) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-overlay {
  text-align: center;
  padding: 2rem 1.5rem;
  max-width: 500px;
}

.brand-section {
  animation: fadeInUp 1s ease-out;
}

.brand-logo {
  width: 70%;
  max-width: 420px;
  height: auto;
  display: block;
  margin: 0 auto;
}

.login-form-container {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem 2rem;
}

.login-form {
  width: 100%;
}

.login-btn {
  background: linear-gradient(45deg, #FF9800 30%, #FF5722 90%);
  box-shadow: 0 3px 5px 2px rgba(255, 152, 0, 0.3);
}

.login-btn:hover {
  background: linear-gradient(45deg, #F57C00 30%, #E64A19 90%);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile responsiveness */
@media (max-width: 960px) {
  .login-form-container {
    padding: 1.25rem;
  }
}
</style>