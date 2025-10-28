<template>
  <div class="firmware-page">
    <!-- Clean Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Firmware Management</h1>
        <p class="page-subtitle">จัดการเวอร์ชัน firmware สำหรับอุปกรณ์</p>
      </div>
    </div>

    <!-- Alert Messages -->
    <v-slide-y-transition>
      <v-alert
        v-if="successMessage"
        variant="flat"
        color="success"
        closable
        class="minimal-alert mb-6"
        @click:close="clearMessages"
      >
        <v-icon size="20" class="mr-2">mdi-check-circle</v-icon>
        {{ successMessage }}
      </v-alert>
    </v-slide-y-transition>

    <v-slide-y-transition>
      <v-alert
        v-if="error"
        variant="flat"
        color="error"
        closable
        class="minimal-alert mb-6"
        @click:close="clearMessages"
      >
        <v-icon size="20" class="mr-2">mdi-alert-circle</v-icon>
        {{ error }}
      </v-alert>
    </v-slide-y-transition>

    <!-- Firmware Cards Grid -->
    <v-row>
      <!-- Carwash Firmware -->
      <v-col cols="12" lg="6">
        <FirmwareInfoCard
          title="Carwash"
          icon="mdi-car-wash"
          :firmware="carwashFirmware"
          :loading="isLoadingCarwash"
          :format-file-size="formatFileSize"
          @refresh="getLatestCarwashFirmware"
          @upload="openUploadDialog('carwash')"
        />
      </v-col>

      <!-- Helmet Firmware -->
      <v-col cols="12" lg="6">
        <FirmwareInfoCard
          title="Helmet"
          icon="mdi-helmet-safety"
          :firmware="helmetFirmware"
          :loading="isLoadingHelmet"
          :format-file-size="formatFileSize"
          @refresh="getLatestHelmetFirmware"
          @upload="openUploadDialog('helmet')"
        />
      </v-col>
    </v-row>

    <!-- Upload Dialog -->
    <UploadFirmwareDialog
      v-model="showUploadDialog"
      :firmware-type="selectedFirmwareType"
      :is-uploading="isUploading"
      @upload="handleUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useFirmware } from "~/composables/useFirmware";
import type { FirmwareType } from "~/types/firmware.type";
import UploadFirmwareDialog from "~/components/firmware/UploadFirmwareDialog.vue";
import FirmwareInfoCard from "~/components/firmware/FirmwareInfoCard.vue";


// Use composable
const {
  carwashFirmware,
  helmetFirmware,
  isLoadingCarwash,
  isLoadingHelmet,
  isUploading,
  error,
  successMessage,
  getLatestCarwashFirmware,
  getLatestHelmetFirmware,
  uploadFirmware,
  clearMessages,
  formatFileSize,
} = useFirmware();

// Local state
const showUploadDialog = ref(false);
const selectedFirmwareType = ref<FirmwareType>("carwash");

// Methods
const openUploadDialog = (type: FirmwareType) => {
  selectedFirmwareType.value = type;
  showUploadDialog.value = true;
};

const handleUpload = async (files: File[]) => {
  const result = await uploadFirmware(files, selectedFirmwareType.value);
  if (result) {
    showUploadDialog.value = false;
  }
};

// Load data on mount
onMounted(async () => {
  await Promise.all([
    getLatestCarwashFirmware(),
    getLatestHelmetFirmware(),
  ]);
});
</script>

<style scoped>
.firmware-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-header {
  margin-bottom: 48px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 15px;
  font-weight: 400;
  margin: 0;
}

.minimal-alert {
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 500;
}
</style>
