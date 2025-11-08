<template>
  <v-dialog v-model="isOpen" max-width="600" persistent>
    <v-card>
      <v-card-title class="pa-6">
        <h3 class="text-h5">เปลี่ยนรหัสผ่าน</h3>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form
          ref="formRef"
          v-model="formValid"
          @submit.prevent="handleSubmit"
        >
          <v-row>
            <!-- Password -->
            <v-col cols="12">
              <v-text-field
                v-model="form.password"
                label="รหัสผ่านใหม่"
                type="password"
                variant="outlined"
                density="compact"
                :rules="passwordRules"
                required
                prepend-inner-icon="mdi-lock"
              >
                <template #append-inner>
                  <v-tooltip location="top">
                    <template #activator="{ props: tooltipProps }">
                      <v-icon v-bind="tooltipProps" size="small" color="grey">
                        mdi-information
                      </v-icon>
                    </template>
                    <span
                      >ต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์ใหญ่
                      ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ</span
                    >
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>

            <!-- Confirm Password -->
            <v-col cols="12">
              <v-text-field
                v-model="form.confirmPassword"
                label="ยืนยันรหัสผ่านใหม่"
                type="password"
                variant="outlined"
                density="compact"
                :rules="confirmPasswordRules"
                required
                prepend-inner-icon="mdi-lock-check"
              >
              </v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6">
        <v-spacer />
        <v-btn
          color="grey"
          variant="outlined"
          @click="handleCancel"
          :disabled="isSubmitting"
        >
          ยกเลิก
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="handleSubmit"
          :loading="isSubmitting"
          :disabled="!formValid || isSubmitting"
        >
          เปลี่ยนรหัสผ่าน
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useUser } from "~/composables/useUser";
import type { UserResponseApi } from "~/services/apis/user-api.service";

const props = defineProps<{
  modelValue: boolean;
  user: UserResponseApi | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const formRef = ref();
const formValid = ref(false);
const isSubmitting = ref(false);

const form = ref({
  password: "",
  confirmPassword: "",
});

const { changeUserPassword, isChangingPassword, error, successMessage } =
  useUser();

// Validation Rules
const passwordRules = [
  (v: string) => !!v || "กรุณากรอกรหัสผ่าน",
  (v: string) => v.length >= 8 || "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
  (v: string) =>
    /[a-z]/.test(v) || "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว",
  (v: string) =>
    /[A-Z]/.test(v) || "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว",
  (v: string) => /\d/.test(v) || "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว",
  (v: string) =>
    /[@$!%*?&]/.test(v) || "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว",
];

const confirmPasswordRules = [
  (v: string) => !!v || "กรุณายืนยันรหัสผ่าน",
  (v: string) => v === form.value.password || "รหัสผ่านไม่ตรงกัน",
];

const resetForm = () => {
  form.value = {
    password: "",
    confirmPassword: "",
  };
  formRef.value?.resetValidation();
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  const { valid } = await formRef.value.validate();
  if (!valid || !props.user?.id) return;

  try {
    isSubmitting.value = true;
    await changeUserPassword(props.user.id, {
      password: form.value.password,
    });

    if (successMessage.value) {
      emit("success");
      emit("update:modelValue", false);
      resetForm();
    }
  } catch (err) {
    console.error("Error changing password:", err);
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  emit("update:modelValue", false);
  resetForm();
};

watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) {
      resetForm();
    }
  }
);
</script>
