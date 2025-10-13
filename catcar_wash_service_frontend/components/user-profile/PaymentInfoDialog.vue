<template>
  <v-dialog v-model="dialog" max-width="600" persistent>
    <v-card rounded="lg">
      <!-- Loading Overlay -->
      <v-overlay
        :model-value="loading"
        contained
        persistent
        class="align-center justify-center"
      >
        <v-progress-circular indeterminate size="64" color="primary" />
      </v-overlay>

      <v-card-title class="pa-6">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon color="primary" class="me-3">mdi-key-variant</v-icon>
            <span class="text-h6 font-weight-bold">ตั้งค่า API Key</span>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            :disabled="loading"
            @click="handleCancel"
          />
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-6">
        <v-form ref="formRef">
          <div class="d-flex flex-column ga-4">
            <!-- Merchant ID -->
            <div>
              <div
                v-if="!isEditingField.merchant_id"
                class="d-flex justify-space-between align-center"
              >
                <div>
                  <div class="text-caption text-medium-emphasis">
                    Merchant ID
                  </div>
                  <div class="text-body-1 font-weight-medium">
                    {{ currentValues.merchant_id || "ไม่ได้ระบุ" }}
                  </div>
                </div>
                <v-btn
                  variant="text"
                  size="small"
                  class="text-none"
                  :disabled="loading"
                  @click="startEditingField('merchant_id')"
                >
                  {{ currentValues.merchant_id ? "แก้ไข" : "เพิ่ม" }}
                </v-btn>
              </div>
              <div v-else>
                <v-text-field
                  v-model="editForm.merchant_id"
                  label="Merchant ID"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  :disabled="loading"
                  :placeholder="currentValues.merchant_id || 'ไม่ได้ระบุ'"
                  @input="clearError"
                />
                <div class="d-flex ga-2 mt-2">
                  <v-btn
                    size="small"
                    variant="text"
                    class="text-none"
                    :disabled="loading"
                    @click="cancelEditingField('merchant_id')"
                  >
                    ยกเลิก
                  </v-btn>
                </div>
              </div>
            </div>

            <v-divider />

            <!-- API Key -->
            <div>
              <div
                v-if="!isEditingField.api_key"
                class="d-flex justify-space-between align-center"
              >
                <div>
                  <div class="text-caption text-medium-emphasis">API Key</div>
                  <div class="text-body-1 font-weight-medium">
                    {{ currentValues.api_key || "ไม่ได้ระบุ" }}
                  </div>
                </div>
                <v-btn
                  variant="text"
                  size="small"
                  class="text-none"
                  :disabled="loading"
                  @click="startEditingField('api_key')"
                >
                  {{ currentValues.api_key ? "แก้ไข" : "เพิ่ม" }}
                </v-btn>
              </div>
              <div v-else>
                <v-text-field
                  v-model="editForm.api_key"
                  label="API Key"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  :disabled="loading"
                  :placeholder="currentValues.api_key || 'ไม่ได้ระบุ'"
                  @input="clearError"
                />
                <div class="d-flex ga-2 mt-2">
                  <v-btn
                    size="small"
                    variant="text"
                    class="text-none"
                    :disabled="loading"
                    @click="cancelEditingField('api_key')"
                  >
                    ยกเลิก
                  </v-btn>
                </div>
              </div>
            </div>

            <v-divider />

            <!-- HMAC Key -->
            <div>
              <div
                v-if="!isEditingField.HMAC_key"
                class="d-flex justify-space-between align-center"
              >
                <div>
                  <div class="text-caption text-medium-emphasis">HMAC Key</div>
                  <div class="text-body-1 font-weight-medium">
                    {{ currentValues.HMAC_key || "ไม่ได้ระบุ" }}
                  </div>
                </div>
                <v-btn
                  variant="text"
                  size="small"
                  class="text-none"
                  :disabled="loading"
                  @click="startEditingField('HMAC_key')"
                >
                  {{ currentValues.HMAC_key ? "แก้ไข" : "เพิ่ม" }}
                </v-btn>
              </div>
              <div v-else>
                <v-text-field
                  v-model="editForm.HMAC_key"
                  label="HMAC Key"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  :disabled="loading"
                  :placeholder="currentValues.HMAC_key || 'ไม่ได้ระบุ'"
                  @input="clearError"
                />
                <div class="d-flex ga-2 mt-2">
                  <v-btn
                    size="small"
                    variant="text"
                    class="text-none"
                    :disabled="loading"
                    @click="cancelEditingField('HMAC_key')"
                  >
                    ยกเลิก
                  </v-btn>
                </div>
              </div>
            </div>

            <v-alert type="info" variant="tonal" density="compact">
              คุณสามารถกรอกเฉพาะค่าที่ต้องการเปลี่ยนแปลง
              ค่าที่ไม่ได้กรอกจะยังคงเป็นค่าเดิม
            </v-alert>

            <v-alert
              v-if="localApiError"
              type="error"
              variant="tonal"
              density="compact"
            >
              <div class="d-flex align-center">
                <v-icon class="me-2">mdi-alert-circle</v-icon>
                <div>
                  <div class="font-weight-bold">การอัปเดตล้มเหลว</div>
                  <div class="text-caption">{{ localApiError }}</div>
                </div>
              </div>
            </v-alert>
          </div>
        </v-form>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="text"
          class="text-none"
          :disabled="loading"
          @click="handleCancel"
        >
          ยกเลิก
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          :loading="loading"
          :disabled="loading"
          @click="handleConfirm"
        >
          บันทึก
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

interface PaymentInfo {
  merchant_id?: string;
  api_key?: string;
  HMAC_key?: string;
}

interface Props {
  modelValue: boolean;
  currentValues?: PaymentInfo;
  loading?: boolean;
  apiError?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currentValues: () => ({
    merchant_id: "",
    api_key: "",
    HMAC_key: "",
  }),
  loading: false,
  apiError: "",
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [value: PaymentInfo];
}>();

const dialog = ref(props.modelValue);
const formRef = ref();
const localApiError = ref("");

const editForm = ref<PaymentInfo>({
  merchant_id: "",
  api_key: "",
  HMAC_key: "",
});

const isEditingField = ref({
  merchant_id: false,
  api_key: false,
  HMAC_key: false,
});

const clearError = () => {
  localApiError.value = "";
};

const startEditingField = (field: keyof typeof isEditingField.value) => {
  isEditingField.value[field] = true;
};

const cancelEditingField = (field: keyof typeof isEditingField.value) => {
  isEditingField.value[field] = false;
  editForm.value[field] = "";
};

const handleCancel = () => {
  editForm.value = {
    merchant_id: "",
    api_key: "",
    HMAC_key: "",
  };
  isEditingField.value = {
    merchant_id: false,
    api_key: false,
    HMAC_key: false,
  };
  localApiError.value = "";
  dialog.value = false;
  emit("update:modelValue", false);
};

const handleConfirm = async () => {
  // Clear previous errors
  localApiError.value = "";

  // Only send values from fields that were being edited and have non-empty values
  const updatePayload: PaymentInfo = {};

  if (isEditingField.value.merchant_id && editForm.value.merchant_id?.trim()) {
    updatePayload.merchant_id = editForm.value.merchant_id.trim();
  }
  if (isEditingField.value.api_key && editForm.value.api_key?.trim()) {
    updatePayload.api_key = editForm.value.api_key.trim();
  }
  if (isEditingField.value.HMAC_key && editForm.value.HMAC_key?.trim()) {
    updatePayload.HMAC_key = editForm.value.HMAC_key.trim();
  }

  // If nothing was entered, don't proceed
  if (Object.keys(updatePayload).length === 0) {
    handleCancel();
    return;
  }

  // Emit confirm event - parent will handle API call and close dialog on success
  emit("confirm", updatePayload);
};

// Watch for dialog changes
watch(
  () => props.modelValue,
  (newVal) => {
    dialog.value = newVal;
    if (newVal) {
      // Clear form, editing state, and errors when dialog opens
      editForm.value = {
        merchant_id: "",
        api_key: "",
        HMAC_key: "",
      };
      isEditingField.value = {
        merchant_id: false,
        api_key: false,
        HMAC_key: false,
      };
      localApiError.value = "";
    }
  }
);

watch(dialog, (newVal) => {
  if (!newVal) {
    emit("update:modelValue", false);
  }
});

// Watch for API error from parent
watch(
  () => props.apiError,
  (newVal) => {
    if (newVal) {
      localApiError.value = newVal;
    }
  }
);
</script>
