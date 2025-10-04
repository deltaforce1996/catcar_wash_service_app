<template>
  <v-dialog v-model="isOpen" max-width="800" persistent>
    <v-card>
      <v-card-title class="pa-6">
        <h3 class="text-h5">เพิ่มลูกค้าใหม่</h3>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form
          ref="formRef"
          v-model="formValid"
          @submit.prevent="handleSubmit"
        >
          <v-row>
            <!-- Full Name -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.fullname"
                label="ชื่อ-นามสกุล"
                variant="outlined"
                density="compact"
                :rules="requiredRules"
                required
              />
            </v-col>

            <!-- Custom Name -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.custom_name"
                label="ชื่อเรียก/ชื่อร้าน"
                variant="outlined"
                density="compact"
              />
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
              />
            </v-col>

            <!-- Address -->
            <v-col cols="12">
              <v-textarea
                v-model="form.address"
                label="ที่อยู่"
                variant="outlined"
                density="compact"
                rows="3"
              />
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
          เพิ่มลูกค้า
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useUser } from "~/composables/useUser";

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
const { registerUser, isCreating, error } = useUser();

// Computed for v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Local state
const formRef = ref();
const formValid = ref(false);
const formErrors = ref<string[]>([]);

// Form data matching backend RegisterUserDto
interface CustomerForm {
  fullname: string;
  email: string;
  phone: string;
  address: string;
  custom_name: string;
}

const form = ref<CustomerForm>({
  fullname: "",
  email: "",
  phone: "",
  address: "",
  custom_name: "",
});

// Validation rules
const emailRules = [
  (v: string) => !!v || "กรุณากรอกอีเมล",
  (v: string) => /.+@.+\..+/.test(v) || "รูปแบบอีเมลไม่ถูกต้อง",
];

const optionalPhoneRules = [
  (v: string) => !v || /^[0-9]{10}$/.test(v) || "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก",
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
    // Send only the fields that backend RegisterUserDto accepts
    // Backend will automatically set status=ACTIVE and permission=USER
    const payload = {
      fullname: form.value.fullname,
      email: form.value.email,
      phone: form.value.phone,
      address: form.value.address,
      custom_name: form.value.custom_name,
    };

    await registerUser(payload);

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
    fullname: "",
    email: "",
    phone: "",
    address: "",
    custom_name: "",
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

// Watch for dialog close to reset form
watch(isOpen, (newValue) => {
  if (!newValue) {
    resetForm();
  }
});
</script>
