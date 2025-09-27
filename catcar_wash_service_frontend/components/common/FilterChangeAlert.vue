<template>
  <v-alert
    v-if="show"
    border
    density="compact"
    type="warning"
    variant="tonal"
    :class="alertClass"
  >
    <template #prepend>
      <v-icon>mdi-information</v-icon>
    </template>
    <strong>{{ title }}</strong> {{ message }}
  </v-alert>
</template>

<script setup lang="ts">
interface Props {
  show: boolean;
  title?: string;
  message?: string;
  alertClass?: string;
}

withDefaults(defineProps<Props>(), {
  title: 'เตือน:',
  message: 'คุณได้เปลี่ยนแปลงตัวกรองแล้ว กรุณากดปุ่ม "ยืนยันตัวกรอง" เพื่อใช้งานตัวกรองใหม่',
  alertClass: 'my-2',
});
</script>