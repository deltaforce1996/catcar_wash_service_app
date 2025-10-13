<template>
  <v-card color="surface-container" class="h-100" rounded="lg" elevation="2">
    <v-card-title class="pa-6">
      <div class="d-flex align-center">
        <v-icon color="primary" size="24" class="me-3" aria-hidden="true">
          mdi-account-circle
        </v-icon>
        <span class="text-h6 font-weight-bold">ข้อมูลส่วนตัว</span>
      </div>
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-6">
      <div class="d-flex flex-column ga-4">
        <!-- Name -->
        <div>
          <div class="d-flex justify-space-between align-center mb-2">
            <div class="text-caption text-medium-emphasis">ชื่อ-นามสกุล</div>
            <v-btn
              v-if="showEditButton"
              variant="text"
              size="small"
              class="text-none"
              @click="openEditDialog('name')"
            >
              แก้ไข
            </v-btn>
          </div>
          <div class="text-body-1 font-weight-medium">
            {{ name || "-" }}
          </div>
        </div>

        <!-- Email -->
        <div>
          <div class="d-flex justify-space-between align-center mb-2">
            <div class="text-caption text-medium-emphasis">อีเมล</div>
            <v-btn
              v-if="showEditButton"
              variant="text"
              size="small"
              class="text-none"
              @click="openEditDialog('email')"
            >
              แก้ไข
            </v-btn>
          </div>
          <div class="text-body-1 font-weight-medium">
            {{ email || "-" }}
          </div>
        </div>

        <!-- Phone -->
        <div>
          <div class="d-flex justify-space-between align-center mb-2">
            <div class="text-caption text-medium-emphasis">เบอร์โทรศัพท์</div>
            <v-btn
              v-if="showEditButton"
              variant="text"
              size="small"
              class="text-none"
              @click="openEditDialog('phone')"
            >
              แก้ไข
            </v-btn>
          </div>
          <div class="text-body-1 font-weight-medium">
            {{ formatPhoneNumber(phone) }}
          </div>
        </div>

        <!-- LINE ID -->
        <div>
          <div class="d-flex justify-space-between align-center mb-2">
            <div class="text-caption text-medium-emphasis">LINE ID</div>
            <v-btn
              v-if="showEditButton"
              variant="text"
              size="small"
              class="text-none"
              @click="openEditDialog('line')"
            >
              แก้ไข
            </v-btn>
          </div>
          <div class="text-body-1 font-weight-medium">
            {{ line || "-" }}
          </div>
        </div>

        <!-- Address -->
        <div>
          <div class="d-flex justify-space-between align-center mb-2">
            <div class="text-caption text-medium-emphasis">ที่อยู่</div>
            <v-btn
              v-if="showEditButton"
              variant="text"
              size="small"
              class="text-none"
              @click="openEditDialog('address')"
            >
              แก้ไข
            </v-btn>
          </div>
          <div class="text-body-1 font-weight-medium">
            {{ address || "-" }}
          </div>
        </div>
      </div>
    </v-card-text>

    <!-- Edit Dialog -->
    <EditFieldDialog
      v-model="editDialog"
      :field-label="currentFieldConfig.label"
      :field-name="currentFieldConfig.name"
      :current-value="currentFieldConfig.value"
      :field-type="currentFieldConfig.type"
      :additional-rules="currentFieldConfig.rules"
      :loading="isSaving"
      :api-error="editError"
      @confirm="handleConfirmEdit"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuth } from "~/composables/useAuth";
import EditFieldDialog from "./EditFieldDialog.vue";

interface Props {
  name?: string;
  email?: string;
  phone?: string;
  line?: string;
  address?: string;
  showEditButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  name: "",
  email: "",
  phone: "",
  line: "",
  address: "",
  showEditButton: true,
});

const { updateProfile } = useAuth();

const editDialog = ref(false);
const currentField = ref<string>("");
const isSaving = ref(false);
const editError = ref("");

// Field configurations
const fieldConfigs: Record<
  string,
  {
    label: string;
    name: string;
    value: string;
    type: string;
    rules: Array<(v: string) => boolean | string>;
  }
> = {
  name: {
    label: "ชื่อ-นามสกุล",
    name: "name",
    value: props.name || "",
    type: "text",
    rules: [],
  },
  email: {
    label: "อีเมล",
    name: "email",
    value: props.email || "",
    type: "email",
    rules: [
      (v: string) => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !v || pattern.test(v) || "รูปแบบอีเมลไม่ถูกต้อง";
      },
    ],
  },
  phone: {
    label: "เบอร์โทรศัพท์",
    name: "phone",
    value: props.phone || "",
    type: "tel",
    rules: [
      (v: string) => {
        if (!v) return true;
        const pattern = /^\+?[0-9]{10,15}$/;
        return (
          pattern.test(v.replace(/\s/g, "")) || "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง"
        );
      },
    ],
  },
  line: {
    label: "LINE ID",
    name: "line",
    value: props.line || "",
    type: "text",
    rules: [],
  },
  address: {
    label: "ที่อยู่",
    name: "address",
    value: props.address || "",
    type: "text",
    rules: [],
  },
};

const currentFieldConfig = computed(() => {
  if (currentField.value && fieldConfigs[currentField.value]) {
    const config = fieldConfigs[currentField.value];
    // Update value dynamically based on props
    return {
      ...config,
      value:
        currentField.value === "name"
          ? props.name || ""
          : currentField.value === "email"
          ? props.email || ""
          : currentField.value === "phone"
          ? props.phone || ""
          : currentField.value === "line"
          ? props.line || ""
          : props.address || "",
    };
  }
  return {
    label: "",
    name: "",
    value: "",
    type: "text",
    rules: [],
  };
});

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

const openEditDialog = (field: string) => {
  currentField.value = field;
  editError.value = "";
  editDialog.value = true;
};

const handleConfirmEdit = async (newValue: string) => {
  isSaving.value = true;
  editError.value = "";

  try {
    // Create update payload with only the field being edited
    const updatePayload: Record<string, string> = {
      [currentField.value]: newValue,
    };

    await updateProfile(updatePayload);
    // Only close dialog on success
    editDialog.value = false;
  } catch (error: any) {
    console.error("Failed to update profile:", error);
    // Set error message for dialog to display
    editError.value = error?.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล";
  } finally {
    isSaving.value = false;
  }
};
</script>
