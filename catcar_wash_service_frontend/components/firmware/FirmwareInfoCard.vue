<template>
  <div class="firmware-card">
    <!-- Card Header -->
    <div class="card-header">
      <div class="d-flex align-center flex-grow-1">
        <div class="icon-wrapper">
          <v-icon :icon="icon" size="24" />
        </div>
        <div class="ml-3 flex-grow-1">
          <h3 class="card-title">{{ title }}</h3>
          <p v-if="firmware" class="card-version">v{{ firmware.version }}</p>
          <p v-else class="card-version text-grey">No firmware</p>
        </div>
      </div>

      <!-- Version Selector -->
      <div v-if="versions.length > 0" class="version-selector ml-4">
        <v-select
          :model-value="selectedVersion"
          :items="versionItems"
          label="เลือกเวอร์ชัน"
          variant="outlined"
          density="compact"
          hide-details
          style="min-width: 160px"
          @update:model-value="$emit('version-change', $event)"
        >
          <template #prepend-inner>
            <v-icon size="18">mdi-tag</v-icon>
          </template>
        </v-select>
      </div>

      <div class="d-flex ga-2 ml-4">
        <button class="icon-btn" :disabled="loading" @click="$emit('refresh')">
          <v-icon :class="{ 'rotate-animation': loading }" size="20">mdi-refresh</v-icon>
        </button>
        <button class="primary-btn" @click="$emit('upload')">
          <v-icon size="18" class="mr-1">mdi-upload</v-icon>
          Upload
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="card-body loading-state">
      <v-progress-circular indeterminate size="40" width="3" color="#f57f2a" />
      <p class="loading-text">Loading firmware data...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!firmware" class="card-body empty-state">
      <div class="empty-icon">
        <v-icon size="48" color="#cbd5e1">mdi-package-variant-closed</v-icon>
      </div>
      <p class="empty-title">No Firmware Available</p>
      <p class="empty-description">Upload your first firmware to get started</p>
    </div>

    <!-- Firmware Data -->
    <div v-else class="card-body">
      <!-- HW Variant -->
      <div class="firmware-section">
        <div class="section-header">
          <v-icon size="18" color="#64748b">mdi-cpu-64-bit</v-icon>
          <span class="section-label">Hardware (HW)</span>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Filename</span>
            <span class="info-value">{{ firmware.files.hw.filename }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">HW Version</span>
            <span class="info-value">{{ firmware.files.hw.hw_version }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Size</span>
            <span class="info-value">{{ formatFileSize(firmware.files.hw.size) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">SHA256</span>
            <span class="info-value mono">{{ firmware.files.hw.sha256.substring(0, 16) }}...</span>
          </div>
        </div>

        <a :href="firmware.files.hw.url" target="_blank" class="download-link">
          <v-icon size="16">mdi-download</v-icon>
          Download HW Firmware
        </a>
      </div>

      <!-- Divider -->
      <div class="divider"/>

      <!-- QR Variant -->
      <div class="firmware-section">
        <div class="section-header">
          <v-icon size="18" color="#64748b">mdi-qrcode</v-icon>
          <span class="section-label">QR Code (QR)</span>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Filename</span>
            <span class="info-value">{{ firmware.files.qr.filename }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">HW Version</span>
            <span class="info-value">{{ firmware.files.qr.hw_version }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Size</span>
            <span class="info-value">{{ formatFileSize(firmware.files.qr.size) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">SHA256</span>
            <span class="info-value mono">{{ firmware.files.qr.sha256.substring(0, 16) }}...</span>
          </div>
        </div>

        <a :href="firmware.files.qr.url" target="_blank" class="download-link">
          <v-icon size="16">mdi-download</v-icon>
          Download QR Firmware
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { FirmwareLatestResponse } from "~/types/firmware.type";

const props = defineProps<{
  title: string;
  icon: string;
  firmware: FirmwareLatestResponse | null;
  loading: boolean;
  versions: string[];
  selectedVersion: string;
  formatFileSize: (bytes: number) => string;
}>();

defineEmits<{
  refresh: [];
  upload: [];
  "version-change": [version: string];
}>();

// Computed property สำหรับ dropdown items
const versionItems = computed(() => {
  if (props.versions.length === 0) return [];

  return props.versions.map((version, index) => ({
    title: index === 0 ? `v${version} (ล่าสุด)` : `v${version}`,
    value: version,
  }));
});
</script>

<style scoped>
.firmware-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-surface-variant));
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.firmware-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(var(--v-theme-primary));
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
  letter-spacing: -0.2px;
}

.card-version {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 4px 0 0 0;
  font-weight: 500;
}

/* Buttons */
.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgb(var(--v-theme-surface-variant));
  background: rgb(var(--v-theme-surface));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: rgb(var(--v-theme-on-surface-variant));
}

.icon-btn:hover:not(:disabled) {
  background: rgba(var(--v-theme-primary), 0.05);
  border-color: rgba(var(--v-theme-primary), 0.2);
  color: rgb(var(--v-theme-on-surface));
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  border: none;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover {
  background: rgb(var(--v-theme-primary-darken-1));
}

.rotate-animation {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Body */
.card-body {
  padding: 24px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
}

.loading-text {
  margin-top: 16px;
  font-size: 14px;
  color: #64748b;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0;
}

/* Firmware Sections */
.firmware-section {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
}

.info-label {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 500;
  white-space: nowrap;
}

.info-value {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}

.info-value.mono {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Download Link */
.download-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  color: rgb(var(--v-theme-primary));
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.download-link:hover {
  background: rgba(var(--v-theme-primary), 0.15);
  border-color: rgba(var(--v-theme-primary), 0.3);
  color: rgb(var(--v-theme-primary-darken-1));
}

/* Divider */
.divider {
  height: 1px;
  background: rgb(var(--v-theme-surface-variant));
  margin: 24px 0;
}
</style>
