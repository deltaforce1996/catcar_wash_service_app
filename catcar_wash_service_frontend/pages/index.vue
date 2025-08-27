<template>
  <div>
    <v-row class="justify-center align-center" style="min-height: 60vh;">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate size="64" color="primary" class="mb-6" />
        <h2 class="text-h5 mb-2">กำลังโหลดระบบ...</h2>
        <p class="text-body-1 text-grey-darken-1">กำลังเปลี่ยนเส้นทางไปยังแดชบอร์ด</p>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
// Redirect to dashboard immediately
// await navigateTo('/login-page', { replace: true })
await navigateTo('/dashboard', { replace: true })
</script>
