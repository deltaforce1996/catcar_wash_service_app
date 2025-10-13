<template>
  <v-dialog v-model="dialog" max-width="500" persistent>
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
          <span class="text-h6 font-weight-bold">แก้ไข{{ fieldLabel }}</span>
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
          <div class="mb-4">
            <v-text-field
              v-model="value1"
              :label="`${fieldLabel}ใหม่`"
              :type="fieldType"
              variant="outlined"
              density="comfortable"
              :disabled="loading"
              :rules="[rules.required, ...additionalRules]"
              @input="clearError"
            />
          </div>
          <div>
            <v-text-field
              v-model="value2"
              :label="`ยืนยัน${fieldLabel}ใหม่`"
              :type="fieldType"
              variant="outlined"
              density="comfortable"
              :disabled="loading"
              :rules="[rules.required, rules.match]"
              @input="clearError"
            />
          </div>
          <v-alert
            v-if="validationError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            {{ validationError }}
          </v-alert>
          <v-alert
            v-if="localApiError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            <div class="d-flex align-center">
              <v-icon class="me-2">mdi-alert-circle</v-icon>
              <div>
                <div class="font-weight-bold">การอัปเดตล้มเหลว</div>
                <div class="text-caption">{{ localApiError }}</div>
              </div>
            </div>
          </v-alert>
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
          :disabled="loading"
          @click="handleConfirm"
        >
          ยืนยัน
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

interface Props {
  modelValue: boolean;
  fieldLabel: string;
  fieldName: string;
  currentValue?: string;
  fieldType?: string;
  loading?: boolean;
  apiError?: string;
  additionalRules?: Array<(v: string) => boolean | string>;
}

const props = withDefaults(defineProps<Props>(), {
  currentValue: "",
  fieldType: "text",
  loading: false,
  apiError: "",
  additionalRules: () => [],
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [value: string];
}>();

const dialog = ref(props.modelValue);
const formRef = ref();
const value1 = ref("");
const value2 = ref("");
const validationError = ref("");
const localApiError = ref("");

// Validation rules
const rules = {
  required: (v: string) => !!v || "กรุณากรอกข้อมูล",
  match: (v: string) => {
    if (v !== value1.value) {
      return "ข้อมูลไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง";
    }
    return true;
  },
};

const clearError = () => {
  validationError.value = "";
  localApiError.value = "";
};

const handleCancel = () => {
  value1.value = "";
  value2.value = "";
  validationError.value = "";
  localApiError.value = "";
  dialog.value = false;
  emit("update:modelValue", false);
};

const handleConfirm = async () => {
  // Clear previous errors
  validationError.value = "";
  localApiError.value = "";

  const { valid } = await formRef.value.validate();

  if (!valid) {
    validationError.value = "กรุณากรอกข้อมูลให้ถูกต้องและครบถ้วน";
    return;
  }

  if (value1.value !== value2.value) {
    validationError.value = "ข้อมูลไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง";
    return;
  }

  // Emit confirm event - parent will handle API call and close dialog on success
  emit("confirm", value1.value);
};

// Watch for dialog changes
watch(
  () => props.modelValue,
  (newVal) => {
    dialog.value = newVal;
    if (newVal) {
      // Clear both fields and errors when dialog opens
      value1.value = "";
      value2.value = "";
      validationError.value = "";
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
