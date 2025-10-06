<template>
  <v-dialog v-model="isOpen" max-width="800" persistent>
    <v-card>
      <v-card-title class="pa-6">
        <h3 class="text-h5">แก้ไขข้อมูลลูกค้า</h3>
      </v-card-title>

      <v-card-text class="pa-6">
        <!-- Loading Skeleton -->
        <div v-if="isLoadingData">
          <v-row>
            <v-col v-for="i in 5" :key="i" cols="12" md="6">
              <v-skeleton-loader type="text" />
            </v-col>
          </v-row>
        </div>

        <!-- Form -->
        <v-form
          v-else
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
                prepend-inner-icon="mdi-account"
              >
                <template #append-inner>
                  <v-tooltip location="top">
                    <template #activator="{ props: tooltipProps }">
                      <v-icon v-bind="tooltipProps" size="small" color="grey">
                        mdi-information
                      </v-icon>
                    </template>
                    <span>กรอกชื่อและนามสกุลจริงของลูกค้า</span>
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>

            <!-- Custom Name -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.custom_name"
                label="ชื่อเรียก/ชื่อร้าน"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-store"
              >
                <template #append-inner>
                  <v-tooltip location="top">
                    <template #activator="{ props: tooltipProps }">
                      <v-icon v-bind="tooltipProps" size="small" color="grey">
                        mdi-information
                      </v-icon>
                    </template>
                    <span
                      >ชื่อเรียกหรือชื่อร้านที่ใช้ติดต่อกับลูกค้า (ถ้ามี)</span
                    >
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
                    <template #activator="{ props: tooltipProps }">
                      <v-icon v-bind="tooltipProps" size="small" color="grey">
                        mdi-information
                      </v-icon>
                    </template>
                    <span>อีเมลสำหรับติดต่อและเข้าสู่ระบบ</span>
                  </v-tooltip>
                </template>
              </v-text-field>
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
                    <template #activator="{ props: tooltipProps }">
                      <v-icon v-bind="tooltipProps" size="small" color="grey">
                        mdi-information
                      </v-icon>
                    </template>
                    <span>เบอร์โทรศัพท์ 10 หลัก (0xxxxxxxxx) หรือ +66xxxxxxxxx</span>
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>

            <!-- Status -->
            <v-col cols="12" md="6">
              <v-select
                v-model="form.status"
                label="สถานะ"
                variant="outlined"
                density="compact"
                :items="statusOptions"
                :rules="requiredRules"
                required
                prepend-inner-icon="mdi-check-circle"
              >
                <template #append-inner>
                  <v-tooltip location="top">
                    <template #activator="{ props: tooltipProps }">
                      <v-icon v-bind="tooltipProps" size="small" color="grey">
                        mdi-information
                      </v-icon>
                    </template>
                    <span>สถานะการใช้งานของลูกค้า</span>
                  </v-tooltip>
                </template>
              </v-select>
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
                    <template #activator="{ props: tooltipProps }">
                      <v-icon v-bind="tooltipProps" size="small" color="grey">
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
        <v-btn
          variant="outlined"
          :disabled="isLoadingData || isUpdatingData"
          @click="handleClose"
        >
          ยกเลิก
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isUpdatingData"
          :disabled="isLoadingData"
          @click="handleUpdateClick"
        >
          บันทึกการแก้ไข
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useUser } from "~/composables/useUser";
import type { EnumUserStatus } from "~/types";

// Props
interface Props {
  modelValue: boolean;
  userId: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
}>();

// Composable
const { getUserById, updateUserById, isLoading, isUpdating, error } = useUser();

// Computed for v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Loading states
const isLoadingData = computed(() => isLoading.value);
const isUpdatingData = computed(() => isUpdating.value);

// Local state
const formRef = ref();
const formValid = ref(false);
const formErrors = ref<string[]>([]);

// Form data matching UpdateUserPayload
interface CustomerForm {
  fullname: string;
  email: string;
  phone: string;
  address: string;
  custom_name: string;
  status: EnumUserStatus;
}

const form = ref<CustomerForm>({
  fullname: "",
  email: "",
  phone: "",
  address: "",
  custom_name: "",
  status: "ACTIVE",
});

// Validation rules
const emailRules = [
  (v: string) => !!v || "กรุณากรอกอีเมล",
  (v: string) => /.+@.+\..+/.test(v) || "รูปแบบอีเมลไม่ถูกต้อง",
];

const optionalPhoneRules = [
  (v: string) =>
    !v ||
    /^(\+66[0-9]{9}|0[0-9]{9})$/.test(v) ||
    "เบอร์โทรศัพท์ต้องเป็น 10 หลัก (0xxxxxxxxx) หรือ +66xxxxxxxxx",
];

const requiredRules = [(v: string) => !!v || "กรุณากรอกข้อมูล"];

// Status options
const statusOptions = [
  { title: "ใช้งาน", value: "ACTIVE" },
  { title: "ไม่ใช้งาน", value: "INACTIVE" },
];

// Fetch user data when dialog opens
const fetchUserData = async () => {
  if (!props.userId) return;

  try {
    formErrors.value = [];
    const userData = await getUserById(props.userId);

    if (userData) {
      form.value = {
        fullname: userData.fullname || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
        custom_name: userData.custom_name || "",
        status: userData.status || "ACTIVE",
      };

      // Reset validation after loading data
      if (formRef.value) {
        formRef.value.resetValidation();
      }
    }
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", err);
    if (error.value) {
      formErrors.value = [error.value];
    } else {
      formErrors.value = ["เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ กรุณาลองใหม่อีกครั้ง"];
    }
  }
};

// Handle update button click with validation
const handleUpdateClick = async () => {
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
    const payload = {
      fullname: form.value.fullname,
      email: form.value.email,
      phone: form.value.phone,
      address: form.value.address,
      custom_name: form.value.custom_name,
      status: form.value.status,
    };

    await updateUserById(props.userId, payload);

    // Success - emit success event and close dialog
    emit("success");
    handleClose();
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล:", err);
    if (error.value) {
      formErrors.value = [error.value];
    } else {
      formErrors.value = ["เกิดข้อผิดพลาดในการอัปเดตข้อมูล กรุณาลองใหม่อีกครั้ง"];
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
    status: "ACTIVE",
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

// Watch for dialog open to fetch user data
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && props.userId) {
      fetchUserData();
    } else if (!newValue) {
      resetForm();
    }
  },
  { immediate: true },
);

// Watch for userId changes while dialog is open
watch(
  () => props.userId,
  (newUserId) => {
    if (newUserId && props.modelValue) {
      fetchUserData();
    }
  },
  { immediate: true },
);
</script>
