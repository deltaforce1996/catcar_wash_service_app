<template>
  <div>
    <div class="text-center mb-6">
      <h2 class="text-h4 font-weight-bold mb-2">ลืมรหัสผ่าน?</h2>
      <p class="text-body-1 text-grey-darken-1">
        กรุณาใส่อีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
      </p>
    </div>

    <v-form class="forgot-password-form" @submit.prevent="handleForgotPassword">
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

    <v-btn
      type="submit"
      block
      size="large"
      class="mb-6 submit-btn"
      :loading="loading"
      color="orange"
    >
      ส่งลิงก์รีเซ็ตรหัสผ่าน
    </v-btn>

    <div class="text-center">
      <p class="text-body-2 text-grey-darken-1">
        จำรหัสผ่านได้แล้ว?
        <v-btn
          variant="text"
          color="orange"
          size="small"
          @click="goToLogin"
        >
          เข้าสู่ระบบ
        </v-btn>
      </p>
    </div>
    </v-form>
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
.forgot-password-form {
  width: 100%;
}

.submit-btn {
  background: linear-gradient(45deg, #FF9800 30%, #FF5722 90%);
  box-shadow: 0 3px 5px 2px rgba(255, 152, 0, 0.3);
}

.submit-btn:hover {
  background: linear-gradient(45deg, #F57C00 30%, #E64A19 90%);
}
</style>