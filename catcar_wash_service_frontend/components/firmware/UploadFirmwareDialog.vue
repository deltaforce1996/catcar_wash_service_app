<template>
  <v-dialog v-model="dialog" max-width="640" persistent>
    <div class="upload-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <div class="d-flex align-center">
          <div class="header-icon">
            <v-icon size="20">{{ firmwareType === 'carwash' ? 'mdi-car-wash' : 'mdi-helmet-safety' }}</v-icon>
          </div>
          <div class="ml-3">
            <h3 class="dialog-title">Upload {{ firmwareType === 'carwash' ? 'Carwash' : 'Helmet' }} Firmware</h3>
            <p class="dialog-subtitle">Upload 2 files (HW & QR) with matching versions</p>
          </div>
        </div>
        <button class="close-btn" :disabled="isUploading" @click="closeDialog">
          <v-icon size="20">mdi-close</v-icon>
        </button>
      </div>

      <!-- Body -->
      <div class="dialog-body">
        <!-- File Format Guide -->
        <div class="format-guide">
          <div class="guide-title">
            <v-icon size="16" color="#64748b">mdi-information-outline</v-icon>
            Required file format
          </div>
          <div class="guide-content">
            <div class="format-row">
              <span class="format-label">HW:</span>
              <code class="format-code">{{ firmwareType }}_HW_1.0_V1.0.0.bin</code>
            </div>
            <div class="format-row">
              <span class="format-label">QR:</span>
              <code class="format-code">{{ firmwareType }}_QR_HW_1.0_V1.0.0.bin</code>
            </div>
          </div>
        </div>

        <!-- File Upload Input -->
        <v-file-input
          v-model="selectedFiles"
          label="Select 2 firmware files"
          accept=".bin"
          multiple
          variant="outlined"
          density="comfortable"
          prepend-icon=""
          prepend-inner-icon="mdi-paperclip"
          :disabled="isUploading"
          hide-details
          @update:model-value="validateFiles"
        />

        <!-- Validation Messages -->
        <div v-if="validationError" class="validation-message error-message">
          <v-icon size="16">mdi-alert-circle</v-icon>
          {{ validationError }}
        </div>

        <div v-if="validationSuccess" class="validation-message success-message">
          <v-icon size="16">mdi-check-circle</v-icon>
          {{ validationSuccess }}
        </div>

        <!-- File Details -->
        <div v-if="filesInfo.length > 0" class="files-list">
          <div class="files-header">Selected Files</div>
          <div v-for="(info, index) in filesInfo" :key="index" class="file-item">
            <div class="file-icon">
              <v-icon size="20" :color="info.variant === 'HW' ? '#f57f2a' : '#ff9800'">
                mdi-file-document
              </v-icon>
            </div>
            <div class="file-info">
              <div class="file-name">{{ info.filename }}</div>
              <div class="file-meta">
                {{ info.variant }} • HW v{{ info.hwVersion }} • SW v{{ info.swVersion }} • {{ (info.size / 1024).toFixed(1) }} KB
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <button class="cancel-btn" :disabled="isUploading" @click="closeDialog">
          Cancel
        </button>
        <button class="upload-btn" :disabled="!canUpload" @click="handleUpload">
          <v-progress-circular v-if="isUploading" indeterminate size="16" width="2" class="mr-2" />
          <v-icon v-else size="18" class="mr-1">mdi-upload</v-icon>
          {{ isUploading ? 'Uploading...' : 'Upload Firmware' }}
        </button>
      </div>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { FirmwareType } from "~/types/firmware.type";

// Props
const props = defineProps<{
  modelValue: boolean;
  firmwareType: FirmwareType;
  isUploading: boolean;
}>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  upload: [files: File[]];
}>();

// Local state
const selectedFiles = ref<File[]>([]);
const validationError = ref<string | null>(null);
const validationSuccess = ref<string | null>(null);
const filesInfo = ref<any[]>([]);

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const canUpload = computed(() => {
  return (
    selectedFiles.value.length === 2 &&
    !validationError.value &&
    validationSuccess.value !== null
  );
});

// Methods
const parseFilename = (filename: string) => {
  // Try HW pattern: {type}_HW_{hw_version}_V{sw_version}.bin
  const hwPattern = new RegExp(
    `^(${props.firmwareType})_HW_([\\d.]+)_V([\\d.]+)\\.bin$`,
    "i"
  );
  let match = filename.match(hwPattern);

  if (match) {
    return {
      type: match[1].toLowerCase(),
      variant: "HW",
      hwVersion: match[2],
      swVersion: match[3],
    };
  }

  // Try QR pattern: {type}_QR_HW_{hw_version}_V{sw_version}.bin
  const qrPattern = new RegExp(
    `^(${props.firmwareType})_QR_HW_([\\d.]+)_V([\\d.]+)\\.bin$`,
    "i"
  );
  match = filename.match(qrPattern);

  if (match) {
    return {
      type: match[1].toLowerCase(),
      variant: "QR",
      hwVersion: match[2],
      swVersion: match[3],
    };
  }

  return null;
};

const validateFiles = () => {
  validationError.value = null;
  validationSuccess.value = null;
  filesInfo.value = [];

  if (!selectedFiles.value || selectedFiles.value.length === 0) {
    return;
  }

  if (selectedFiles.value.length !== 2) {
    validationError.value = "Please select exactly 2 files (HW and QR)";
    return;
  }

  // Parse filenames
  const parsed = selectedFiles.value.map((file) => ({
    file,
    filename: file.name,
    size: file.size,
    parsed: parseFilename(file.name),
  }));

  // Check if all files have valid names
  if (parsed.some((p) => !p.parsed)) {
    validationError.value = "Invalid filename format";
    return;
  }

  // Check if we have both HW and QR
  const variants = parsed.map((p) => p.parsed!.variant).sort();
  if (variants[0] !== "HW" || variants[1] !== "QR") {
    validationError.value = "Must have both HW and QR files";
    return;
  }

  // Check if software versions match
  const swVersions = parsed.map((p) => p.parsed!.swVersion);
  if (swVersions[0] !== swVersions[1]) {
    validationError.value = `Software version mismatch (${swVersions[0]} and ${swVersions[1]})`;
    return;
  }

  // Check if types match
  const types = parsed.map((p) => p.parsed!.type);
  if (!types.every((t) => t === props.firmwareType)) {
    validationError.value = `File type must be ${props.firmwareType}`;
    return;
  }

  // All validations passed
  validationSuccess.value = `Ready to upload firmware v${swVersions[0]}`;
  filesInfo.value = parsed.map((p) => ({
    filename: p.filename,
    size: p.size,
    variant: p.parsed!.variant,
    hwVersion: p.parsed!.hwVersion,
    swVersion: p.parsed!.swVersion,
  }));
};

const handleUpload = () => {
  if (canUpload.value) {
    emit("upload", selectedFiles.value);
  }
};

const closeDialog = () => {
  if (!props.isUploading) {
    dialog.value = false;
    selectedFiles.value = [];
    validationError.value = null;
    validationSuccess.value = null;
    filesInfo.value = [];
  }
};

// Watch for dialog close to reset state
watch(dialog, (newVal) => {
  if (!newVal) {
    selectedFiles.value = [];
    validationError.value = null;
    validationSuccess.value = null;
    filesInfo.value = [];
  }
});
</script>

<style scoped>
.upload-dialog {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  overflow: hidden;
}

/* Header */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(var(--v-theme-primary));
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
  letter-spacing: -0.2px;
}

.dialog-subtitle {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 4px 0 0 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgb(var(--v-theme-on-surface-variant));
  transition: all 0.2s;
}

.close-btn:hover:not(:disabled) {
  background: rgba(var(--v-theme-primary), 0.05);
  color: rgb(var(--v-theme-on-surface));
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Body */
.dialog-body {
  padding: 24px;
}

/* Format Guide */
.format-guide {
  background: rgba(var(--v-theme-primary), 0.05);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.guide-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 12px;
}

.guide-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.format-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.format-label {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
  width: 28px;
}

.format-code {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-surface));
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

/* Validation Messages */
.validation-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  margin-top: 16px;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fee2e2;
}

.success-message {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #dcfce7;
}

/* Files List */
.files-list {
  margin-top: 20px;
  border: 1px solid rgb(var(--v-theme-surface-variant));
  border-radius: 12px;
  overflow: hidden;
}

.files-header {
  padding: 12px 16px;
  background: rgba(var(--v-theme-primary), 0.05);
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgb(var(--v-theme-surface));
}

.file-item:not(:last-child) {
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
}

.file-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgb(var(--v-theme-surface-variant));
  background: rgba(var(--v-theme-primary), 0.02);
}

.cancel-btn {
  height: 40px;
  padding: 0 20px;
  border-radius: 8px;
  border: 1px solid rgb(var(--v-theme-surface-variant));
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(var(--v-theme-primary), 0.05);
  border-color: rgba(var(--v-theme-primary), 0.2);
  color: rgb(var(--v-theme-on-surface));
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-btn {
  height: 40px;
  padding: 0 24px;
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

.upload-btn:hover:not(:disabled) {
  background: rgb(var(--v-theme-primary-darken-1));
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
