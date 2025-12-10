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
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                density="compact"
                :rules="passwordRules"
                required
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
              />
            </v-col>

            <!-- Confirm Password -->
            <v-col cols="12">
              <v-text-field
                v-model="form.confirmPassword"
                label="ยืนยันรหัสผ่านใหม่"
                :type="showConfirmPassword ? 'text' : 'password'"
                variant="outlined"
                density="compact"
                :rules="confirmPasswordRules"
                required
                prepend-inner-icon="mdi-lock-check"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6">
        <v-spacer />
        <v-btn
          color="grey"
          variant="outlined"
          :disabled="isSubmitting"
          @click="handleCancel"
        >
          ยกเลิก
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isSubmitting"
          :disabled="!formValid || isSubmitting"
          @click="handleSubmit"
        >
          เปลี่ยนรหัสผ่าน
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useEmployee } from "~/composables/useEmployee";
import type { EmpResponseApi } from "~/services/apis/emp-api.service";

const props = defineProps<{
  modelValue: boolean;
  employee: EmpResponseApi | null;
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
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const form = ref({
  password: "",
  confirmPassword: "",
});

const {
  changeEmployeePassword,
  isChangingPassword: _isChangingPassword,
  error: _error,
  successMessage,
} = useEmployee();

// Validation Rules
const passwordRules = [(v: string) => !!v || "กรุณากรอกรหัสผ่าน"];

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
  if (!valid || !props.employee?.id) return;

  try {
    isSubmitting.value = true;
    await changeEmployeePassword(props.employee.id, {
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
