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
                :rules="requiredRules"
                required
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
                :rules="phoneRules"
                required
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
                :rules="requiredRules"
                required
              />
            </v-col>

            <!-- Status -->
            <v-col cols="12" md="6">
              <v-select
                v-model="form.status"
                label="สถานะ"
                variant="outlined"
                density="compact"
                :items="[
                  { value: 'ACTIVE', title: 'ใช้งาน' },
                  { value: 'INACTIVE', title: 'ไม่ใช้งาน' },
                ]"
                item-value="value"
                item-title="title"
                :rules="requiredRules"
                placeholder="เลือกสถานะ"
                required
              />
            </v-col>

            <!-- Permission -->
            <v-col cols="12" md="6">
              <v-select
                v-model="form.permission_id"
                label="สิทธิ์การใช้งาน"
                variant="outlined"
                density="compact"
                :items="permissionOptions"
                item-value="value"
                item-title="label"
                :rules="requiredRules"
                required
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :title="''">
                    <v-chip
                      :color="item.raw.color"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.raw.label }}
                    </v-chip>
                  </v-list-item>
                </template>
                <template #selection="{ item }">
                  <v-chip
                    :color="item.raw.color"
                    size="small"
                    variant="tonal"
                  >
                    {{ item.raw.label }}
                  </v-chip>
                </template>
              </v-select>
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
          <div class="text-subtitle-2 mb-2">
            กรุณาแก้ไขข้อผิดพลาดต่อไปนี้:
          </div>
          <ul class="text-body-2">
            <li v-for="error in formErrors" :key="error">{{ error }}</li>
          </ul>
        </v-alert>
      </v-card-text>

      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn variant="outlined" :disabled="isSubmitting" @click="handleClose">
          ยกเลิก
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isSubmitting"
          @click="handleRegisterClick"
        >
          เพิ่มลูกค้า
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { RegisterUserPayload } from "~/services/apis/user-api.service";
import { UserApiService } from "~/services/apis/user-api.service";

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

// Computed for v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Local state
const formRef = ref();
const formValid = ref(false);
const isSubmitting = ref(false);
const formErrors = ref<string[]>([]);

// Form data
const form = ref<RegisterUserPayload>({
  email: "",
  fullname: "",
  phone: "",
  address: "",
  custom_name: "",
  status: "" as any,
  permission_id: "",
});

// Permission options
const permissionOptions = [
  { value: "USER", label: "ผู้ใช้ทั่วไป", color: "info" },
  { value: "TECHNICIAN", label: "ช่างเทคนิค", color: "warning" },
  { value: "ADMIN", label: "ผู้ดูแลระบบ", color: "primary" },
];

// Validation rules
const emailRules = [
  (v: string) => !!v || "กรุณากรอกอีเมล",
  (v: string) => /.+@.+\..+/.test(v) || "รูปแบบอีเมลไม่ถูกต้อง",
];

const phoneRules = [
  (v: string) => !!v || "กรุณากรอกเบอร์โทรศัพท์",
  (v: string) => /^[0-9]{10}$/.test(v) || "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก",
];

const requiredRules = [(v: string) => !!v || "กรุณากรอกข้อมูล"];

// API service
const userApiService = new UserApiService();

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
  isSubmitting.value = true;

  try {
    const selectedPermission = permissionOptions.find(
      (p) => p.value === form.value.permission_id
    );

    if (!selectedPermission) {
      throw new Error("กรุณาเลือกสิทธิ์การใช้งาน");
    }

    const payload: RegisterUserPayload = {
      ...form.value,
      permission_id: form.value.permission_id,
    };

    await userApiService.RegisterUser(payload);

    // Success - emit success event and close dialog
    emit("success");
    handleClose();
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการลงทะเบียน:", error);
    formErrors.value = ["เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง"];
  } finally {
    isSubmitting.value = false;
  }
};

// Reset form
const resetForm = () => {
  form.value = {
    email: "",
    fullname: "",
    phone: "",
    address: "",
    custom_name: "",
    status: "" as any,
    permission_id: "",
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
