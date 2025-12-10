<template>
  <v-dialog v-model="isOpen" max-width="700" persistent>
    <v-card>
      <v-card-title class="pa-6">
        <div class="d-flex align-center">
          <v-icon class="mr-2" :color="hasErrors ? 'warning' : 'success'">
            {{ hasErrors ? "mdi-alert-circle" : "mdi-check-circle" }}
          </v-icon>
          <h3 class="text-h5">ผลการซิงค์อุปกรณ์</h3>
        </div>
      </v-card-title>

      <v-card-text class="pa-6">
        <!-- Summary -->
        <v-alert :color="hasErrors ? 'warning' : 'success'" variant="tonal" density="compact" class="mb-4">
          <div class="text-body-1">
            อัปเดตอุปกรณ์สำเร็จ {{ successCount }} จาก {{ totalDevices }} เครื่อง
          </div>
        </v-alert>

        <!-- Device Results List -->
        <div v-if="results && results.length > 0">
          <div class="text-subtitle-2 font-weight-medium mb-3">รายละเอียดการอัปเดตอุปกรณ์</div>

          <v-list class="py-0">
            <v-list-item
              v-for="(result, index) in results"
              :key="result.device_id"
              class="px-4 py-3"
              :class="{ 'border-t': index > 0 }"
            >
              <template #prepend>
                <v-icon :color="result.status === 'success' ? 'success' : 'error'" class="mr-3">
                  {{ result.status === "success" ? "mdi-check-circle" : "mdi-alert-circle" }}
                </v-icon>
              </template>

              <v-list-item-title class="text-body-1 font-weight-medium">
                {{ result.device_name }}
              </v-list-item-title>

              <v-list-item-subtitle class="text-body-2">
                <v-chip
                  :color="getDeviceTypeColor(result.device_type)"
                  size="x-small"
                  variant="tonal"
                  class="mr-2"
                >
                  {{ getDeviceTypeLabel(result.device_type) }}
                </v-chip>
                <span v-if="result.status === 'failed' && result.error" class="text-error">
                  {{ result.error }}
                </span>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-6 text-on-surface-variant">
          <v-icon size="40" class="mb-2">mdi-information-outline</v-icon>
          <p class="text-body-2">ไม่มีข้อมูลการอัปเดตอุปกรณ์</p>
        </div>
      </v-card-text>

      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="handleClose">ปิด</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { DeviceUpdateResult } from "~/types/promotion.type";

interface Props {
  modelValue: boolean;
  results: DeviceUpdateResult[] | undefined;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const totalDevices = computed(() => props.results?.length || 0);
const successCount = computed(() => props.results?.filter((r) => r.status === "success").length || 0);
const hasErrors = computed(() => props.results?.some((r) => r.status === "failed") || false);

const getDeviceTypeColor = (type: string) => {
  return type === "WASH" ? "primary" : "info";
};

const getDeviceTypeLabel = (type: string) => {
  return type === "WASH" ? "เครื่องล้าง" : "เครื่องอบ";
};

const handleClose = () => {
  isOpen.value = false;
};
</script>

<style scoped>
.border-t {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
