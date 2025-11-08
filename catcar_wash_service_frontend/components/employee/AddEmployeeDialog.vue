<template>
  <v-dialog v-model="isOpen" max-width="800" persistent>
    <v-card>
      <v-card-title class="pa-6">
        <h3 class="text-h5">เพิ่มพนักงานใหม่</h3>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form
          ref="formRef"
          v-model="formValid"
          @submit.prevent="handleSubmit"
        >
          <v-row>
            <!-- Name -->
            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                label="ชื่อ-นามสกุล"
                variant="outlined"
                density="compact"
                :rules="requiredRules"
                required
                prepend-inner-icon="mdi-account"
              >
                <template #append-inner>
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" size="small" color="grey">
                        mdi-information
                      </v-icon>
                    </template>
                    <span>กรอกชื่อและนามสกุลจริงของพนักงาน</span>
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>

            <!-- Email -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.email"
                label="อีเมล"
                type="email"
                variant="outlined"
                density="compact"
                :rules="emailRules"
                required
                prepend-inner-icon="mdi-email"
              >
                <template #append-inner>
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" size="small" color="grey">
                        mdi-information
                      </v-icon>
                    </template>
                    <span>อีเมลสำหรับติดต่อและเข้าสู่ระบบ</span>
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>

            <!-- Password -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.password"
                label="รหัสผ่าน"
                type="password"
                variant="outlined"
                density="compact"
                :rules="passwordRules"
                required
                autocomplete="new-password"
                prepend-inner-icon="mdi-lock"
              >
                <template #append-inner>
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" size="small" color="grey">
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
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.confirmPassword"
                label="ยืนยันรหัสผ่าน"
                type="password"
                variant="outlined"
                density="compact"
                :rules="confirmPasswordRules"
                required
                autocomplete="new-password"
                prepend-inner-icon="mdi-lock-check"
              />
            </v-col>

            <!-- Phone -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.phone"
                label="เบอร์โทรศัพท์"
                variant="outlined"
                density="compact"
                :rules="optionalPhoneRules"
                prepend-inner-icon="mdi-phone"
              >
                <template #append-inner>
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" size="small" color="grey">
                        mdi-information
                      </v-icon>
                    </template>
                    <span>เบอร์โทรศัพท์ 10 หลัก (0xxxxxxxxx) หรือ +66xxxxxxxxx</span>
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>

            <!-- LINE ID -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.line"
                label="LINE ID"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-chat"
              >
                <template #append-inner>
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" size="small" color="grey">
                        mdi-information
                      </v-icon>
                    </template>
                    <span>LINE ID สำหรับติดต่อพนักงาน (ไม่บังคับ)</span>
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>

            <!-- Address -->
            <v-col cols="12">
              <v-textarea
                v-model="form.address"
                label="ที่อยู่"
                variant="outlined"
                density="compact"
                rows="3"
                prepend-inner-icon="mdi-map-marker"
              >
                <template #append-inner>
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" size="small" color="grey">
                        mdi-information
                      </v-icon>
                    </template>
                    <span>ที่อยู่สำหรับจัดส่งเอกสารและติดต่อ</span>
                  </v-tooltip>
                </template>
              </v-textarea>
            </v-col>
          </v-row>
        </v-form>

        <!-- Error Display -->
        <v-alert
          v-if="formErrors.length > 0"
          type="error"
          variant="tonal"
          class="mt-4"
          closable
          @click:close="formErrors = []"
        >
          <div class="text-subtitle-2 mb-2">กรุณาแก้ไขข้อผิดพลาดต่อไปนี้:</div>
          <ul class="text-body-2">
            <li v-for="errMsg in formErrors" :key="errMsg">{{ errMsg }}</li>
          </ul>
        </v-alert>
      </v-card-text>

      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn variant="outlined" :disabled="isCreating" @click="handleClose">
          ยกเลิก
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isCreating"
          @click="handleRegisterClick"
        >
          เพิ่มพนักงาน
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useEmployee } from "~/composables/useEmployee";

// Props
interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
}>();

// Composable
const { registerEmployee, isCreating, error } = useEmployee();

// Computed for v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Local state
const formRef = ref();
const formValid = ref(false);
const formErrors = ref<string[]>([]);

// Form data matching backend RegisterEmpDto
interface EmployeeForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  line: string;
  address: string;
}

const form = ref<EmployeeForm>({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  line: "",
  address: "",
});

// Validation rules
const emailRules = [
  (v: string) => !!v || "กรุณากรอกอีเมล",
  (v: string) => /.+@.+\..+/.test(v) || "รูปแบบอีเมลไม่ถูกต้อง",
];

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

const optionalPhoneRules = [
  (v: string) =>
    !v ||
    /^(\+66[0-9]{9}|0[0-9]{9})$/.test(v) ||
    "เบอร์โทรศัพท์ต้องเป็น 10 หลัก (0xxxxxxxxx) หรือ +66xxxxxxxxx",
];

const requiredRules = [(v: string) => !!v || "กรุณากรอกข้อมูล"];

// Handle register button click with validation
const handleRegisterClick = async () => {
  formErrors.value = [];

  const { valid } = await formRef.value.validate();

  if (!valid) {
    formErrors.value = ["กรุณากรอกข้อมูลให้ถูกต้องและครบถ้วน"];
    return;
  }

  handleSubmit();
};

// Submit handler
const handleSubmit = async () => {
  try {
    // Send only the fields that backend RegisterEmpDto accepts
    // Backend will automatically set status=ACTIVE and permission=USER
    const payload = {
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
      phone: form.value.phone || undefined,
      line: form.value.line || undefined,
      address: form.value.address || undefined,
    };

    await registerEmployee(payload);

    // Success - emit success event and close dialog
    emit("success");
    handleClose();
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการลงทะเบียน:", err);
    if (error.value) {
      formErrors.value = [error.value];
    } else {
      formErrors.value = ["เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง"];
    }
  }
};

// Reset form
const resetForm = () => {
  form.value = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    line: "",
    address: "",
  };
  formValid.value = false;
  formErrors.value = [];

  if (formRef.value) {
    formRef.value.reset();
    formRef.value.resetValidation();
  }
};

// Close handler
const handleClose = () => {
  resetForm();
  isOpen.value = false;
};

// Watch for dialog open/close to reset form
watch(isOpen, () => {
  resetForm();
});
</script>
