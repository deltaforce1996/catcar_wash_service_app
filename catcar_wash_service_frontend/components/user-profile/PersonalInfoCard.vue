<template>
  <v-card color="surface-container" class="h-100" rounded="lg" elevation="2">
    <v-card-title class="pa-6">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon color="primary" size="24" class="me-3" aria-hidden="true">
            mdi-account-circle
          </v-icon>
          <span class="text-h6 font-weight-bold">ข้อมูลส่วนตัว</span>
        </div>
        <div v-if="showEditButton" class="d-flex ga-2">
          <template v-if="!isEditing">
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-pencil"
              class="text-none"
              aria-label="แก้ไขโปรไฟล์"
              @click="startEdit"
            >
              แก้ไข
            </v-btn>
          </template>
          <template v-else>
            <v-btn
              color="success"
              variant="tonal"
              size="small"
              prepend-icon="mdi-check"
              class="text-none"
              aria-label="บันทึก"
              :loading="isSaving"
              @click="confirmEdit"
            >
              บันทึก
            </v-btn>
            <v-btn
              color="error"
              variant="tonal"
              size="small"
              prepend-icon="mdi-close"
              class="text-none"
              aria-label="ยกเลิก"
              :disabled="isSaving"
              @click="cancelEdit"
            >
              ยกเลิก
            </v-btn>
          </template>
        </div>
      </div>
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-6">
      <v-form ref="formRef" @submit.prevent="confirmEdit">
        <div class="d-flex flex-column ga-5">
          <div>
            <div class="text-caption text-medium-emphasis mb-2">
              ชื่อ-นามสกุล
            </div>
            <v-text-field
              v-if="isEditing"
              v-model="editForm.fullname"
              density="compact"
              variant="outlined"
              hide-details
              :rules="[rules.required]"
            />
            <div v-else class="text-body-1 font-weight-medium">
              {{ fullname || "-" }}
            </div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis mb-2">
              ชื่อเรียก/ชื่อร้าน
            </div>
            <v-text-field
              v-if="isEditing"
              v-model="editForm.custom_name"
              density="compact"
              variant="outlined"
              hide-details
            />
            <div v-else class="text-body-1 font-weight-medium">
              {{ customName || "-" }}
            </div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis mb-2">อีเมล</div>
            <v-text-field
              v-if="isEditing"
              v-model="editForm.email"
              type="email"
              density="compact"
              variant="outlined"
              hide-details
              :rules="[rules.required, rules.email]"
            />
            <div v-else class="text-body-1 font-weight-medium">
              {{ email || "-" }}
            </div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis mb-2">
              เบอร์โทรศัพท์
            </div>
            <v-text-field
              v-if="isEditing"
              v-model="editForm.phone"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="+66812345678"
              :rules="[rules.phone]"
            />
            <div v-else class="text-body-1 font-weight-medium">
              {{ formatPhoneNumber(phone) }}
            </div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis mb-2">ที่อยู่</div>
            <v-textarea
              v-if="isEditing"
              v-model="editForm.address"
              density="compact"
              variant="outlined"
              hide-details
              rows="2"
            />
            <div v-else class="text-body-1 font-weight-medium">
              {{ address || "-" }}
            </div>
          </div>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuth } from "~/composables/useAuth";

interface Props {
  fullname?: string;
  customName?: string;
  email?: string;
  phone?: string;
  address?: string;
  showEditButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  fullname: "",
  customName: "",
  email: "",
  phone: "",
  address: "",
  showEditButton: true,
});

const { updateProfile } = useAuth();

const isEditing = ref(false);
const isSaving = ref(false);
const formRef = ref();

const editForm = ref({
  fullname: "",
  custom_name: "",
  email: "",
  phone: "",
  address: "",
});

// Validation rules
const rules = {
  required: (v: string) => !!v || "กรุณากรอกข้อมูล",
  email: (v: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !v || pattern.test(v) || "รูปแบบอีเมลไม่ถูกต้อง";
  },
  phone: (v: string) => {
    if (!v) return true;
    const pattern = /^\+?[0-9]{10,15}$/;
    return (
      pattern.test(v.replace(/\s/g, "")) || "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง"
    );
  },
};

const formatPhoneNumber = (phone?: string) => {
  if (!phone) return "-";
  // Format Thai phone number: +66834567890 -> +66 8 3456 7890
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("66")) {
    const countryCode = "+66";
    const number = cleaned.substring(2);
    return `${countryCode} ${number.substring(0, 1)} ${number.substring(
      1,
      5
    )} ${number.substring(5)}`;
  }
  return phone;
};

const startEdit = () => {
  editForm.value = {
    fullname: props.fullname || "",
    custom_name: props.customName || "",
    email: props.email || "",
    phone: props.phone || "",
    address: props.address || "",
  };
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  editForm.value = {
    fullname: "",
    custom_name: "",
    email: "",
    phone: "",
    address: "",
  };
};

const confirmEdit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  isSaving.value = true;
  try {
    await updateProfile(editForm.value);
    isEditing.value = false;
  } catch (error) {
    console.error("Failed to update profile:", error);
  } finally {
    isSaving.value = false;
  }
};

// Watch for prop changes to update form
watch(
  () => [
    props.fullname,
    props.customName,
    props.email,
    props.phone,
    props.address,
  ],
  () => {
    if (!isEditing.value) {
      editForm.value = {
        fullname: props.fullname || "",
        custom_name: props.customName || "",
        email: props.email || "",
        phone: props.phone || "",
        address: props.address || "",
      };
    }
  }
);
</script>
