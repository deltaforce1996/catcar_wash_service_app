<template>
  <v-dialog v-model="isOpen" max-width="900" persistent>
    <v-card>
      <v-card-title class="pa-6">
        <h3 class="text-h5">สร้างโปรโมชั่นใหม่</h3>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form
          ref="formRef"
          v-model="formValid"
          @submit.prevent="handleSubmit"
        >
          <v-row>
            <!-- Promotion Name -->
            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                label="ชื่อโปรโมชั่น"
                variant="outlined"
                density="compact"
                :rules="requiredRules"
                required
                prepend-inner-icon="mdi-tag"
              />
            </v-col>

            <!-- Description -->
            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="รายละเอียด"
                variant="outlined"
                density="compact"
                rows="3"
                prepend-inner-icon="mdi-text"
              />
            </v-col>

            <!-- Discount Percent -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.discount_percent"
                label="เปอร์เซ็นต์ส่วนลด (%)"
                type="number"
                variant="outlined"
                density="compact"
                :rules="percentRules"
                required
                prepend-inner-icon="mdi-percent"
                suffix="%"
                min="0"
                max="100"
              />
            </v-col>

            <!-- Spacer -->
            <v-col cols="12" md="6" />

            <!-- Start Date -->
            <v-col cols="12" md="6">
              <v-menu
                v-model="startDateMenu"
                :close-on-content-click="false"
                location="bottom"
              >
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="formatDateTime(form.start_date)"
                    label="วันที่และเวลาเริ่มต้น"
                    variant="outlined"
                    density="compact"
                    :rules="requiredRules"
                    required
                    readonly
                    prepend-inner-icon="mdi-calendar-start"
                  />
                </template>
                <v-card>
                  <v-date-picker
                    v-model="tempStartDate"
                    :min="new Date().toISOString().split('T')[0]"
                    hide-header
                  />
                  <v-divider />
                  <v-card-text>
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          v-model="tempStartHour"
                          label="ชั่วโมง"
                          type="number"
                          variant="outlined"
                          density="compact"
                          min="0"
                          max="23"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="tempStartMinute"
                          label="นาที"
                          type="number"
                          variant="outlined"
                          density="compact"
                          min="0"
                          max="59"
                        />
                      </v-col>
                    </v-row>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      variant="text"
                      size="small"
                      @click="startDateMenu = false"
                    >
                      ยกเลิก
                    </v-btn>
                    <v-spacer />
                    <v-btn
                      color="primary"
                      size="small"
                      @click="confirmStartDateTime"
                    >
                      ยืนยัน
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-menu>
            </v-col>

            <!-- End Date -->
            <v-col cols="12" md="6">
              <v-menu
                v-model="endDateMenu"
                :close-on-content-click="false"
                location="bottom"
              >
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="formatDateTime(form.end_date)"
                    label="วันที่และเวลาสิ้นสุด"
                    variant="outlined"
                    density="compact"
                    :rules="[...requiredRules, endDateRule]"
                    required
                    readonly
                    prepend-inner-icon="mdi-calendar-end"
                  />
                </template>
                <v-card>
                  <v-date-picker
                    v-model="tempEndDate"
                    :min="new Date().toISOString().split('T')[0]"
                    hide-header
                  />
                  <v-divider />
                  <v-card-text>
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          v-model="tempEndHour"
                          label="ชั่วโมง"
                          type="number"
                          variant="outlined"
                          density="compact"
                          min="0"
                          max="23"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="tempEndMinute"
                          label="นาที"
                          type="number"
                          variant="outlined"
                          density="compact"
                          min="0"
                          max="59"
                        />
                      </v-col>
                    </v-row>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      variant="text"
                      size="small"
                      @click="endDateMenu = false"
                    >
                      ยกเลิก
                    </v-btn>
                    <v-spacer />
                    <v-btn
                      color="primary"
                      size="small"
                      @click="confirmEndDateTime"
                    >
                      ยืนยัน
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-menu>
            </v-col>

            <!-- Assign Users -->
            <v-col cols="12">
              <v-combobox
                v-model="selectedUsers"
                :items="userOptions"
                :loading="isLoadingUsers"
                item-title="title"
                item-value="value"
                label="เลือกลูกค้าที่ต้องการให้ส่วนลด"
                prepend-inner-icon="mdi-account-multiple"
                variant="outlined"
                density="compact"
                chips
                clearable
                closable-chips
                multiple
                hide-details
              >
                <template #chip="{ props, item }">
                  <v-chip
                    v-bind="props"
                    color="primary"
                    size="small"
                    variant="tonal"
                  >
                    {{ item.raw.title }}
                  </v-chip>
                </template>
              </v-combobox>
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
          @click="handleCreateClick"
        >
          สร้างโปรโมชั่น
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { usePromotion } from "~/composables/usePromotion";
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

// Composables
const { createPromotion, isCreating, error } = usePromotion();
const { users, searchUsers } = useUser();

// Computed for v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Local state
const formRef = ref();
const formValid = ref(false);
const formErrors = ref<string[]>([]);
const isLoadingUsers = ref(false);

// Date/Time pickers state
const startDateMenu = ref(false);
const endDateMenu = ref(false);
const tempStartDate = ref<Date | null>(null);
const tempEndDate = ref<Date | null>(null);
const tempStartHour = ref("09");
const tempStartMinute = ref("00");
const tempEndHour = ref("18");
const tempEndMinute = ref("00");

// Form data
interface PromotionForm {
  name: string;
  description: string;
  discount_percent: number;
  start_date: string;
  end_date: string;
}

const form = ref<PromotionForm>({
  name: "",
  description: "",
  discount_percent: 0,
  start_date: "",
  end_date: "",
});

const selectedUsers = ref<{ title: string; value: string }[]>([]);

// User options for dropdown
const userOptions = computed(() =>
  users.value.map((user) => ({
    title: `${user.fullname} (${user.email})`,
    value: user.id,
  }))
);

// Validation rules
const requiredRules = [(v: string | number) => !!v || "กรุณากรอกข้อมูล"];

const percentRules = [
  (v: number) => v !== null && v !== undefined || "กรุณากรอกเปอร์เซ็นต์",
  (v: number) => v >= 0 || "เปอร์เซ็นต์ต้องมากกว่าหรือเท่ากับ 0",
  (v: number) => v <= 100 || "เปอร์เซ็นต์ต้องน้อยกว่าหรือเท่ากับ 100",
];

const endDateRule = () => {
  if (!form.value.start_date || !form.value.end_date) return true;
  const start = new Date(form.value.start_date);
  const end = new Date(form.value.end_date);
  return end > start || "วันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น";
};

// Format datetime for display
const formatDateTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Confirm start date/time
const confirmStartDateTime = () => {
  if (!tempStartDate.value) return;

  const date = new Date(tempStartDate.value);
  date.setHours(parseInt(tempStartHour.value) || 0);
  date.setMinutes(parseInt(tempStartMinute.value) || 0);
  date.setSeconds(0);

  form.value.start_date = date.toISOString();
  startDateMenu.value = false;
};

// Confirm end date/time
const confirmEndDateTime = () => {
  if (!tempEndDate.value) return;

  const date = new Date(tempEndDate.value);
  date.setHours(parseInt(tempEndHour.value) || 0);
  date.setMinutes(parseInt(tempEndMinute.value) || 0);
  date.setSeconds(0);

  form.value.end_date = date.toISOString();
  endDateMenu.value = false;
};

// Load users (USER role only)
const loadUsers = async () => {
  try {
    isLoadingUsers.value = true;
    await searchUsers({
      page: 1,
      limit: 1000, // Get all users
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการโหลดรายชื่อลูกค้า:", err);
  } finally {
    isLoadingUsers.value = false;
  }
};

// Handle create button click
const handleCreateClick = async () => {
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
      name: form.value.name,
      description: form.value.description || undefined,
      discount_percent: form.value.discount_percent,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      user_ids: selectedUsers.value.map((u) => u.value),
    };

    await createPromotion(payload);

    // Success - emit success event and close dialog
    emit("success");
    handleClose();
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการสร้างโปรโมชั่น:", err);
    if (error.value) {
      formErrors.value = [error.value];
    } else {
      formErrors.value = ["เกิดข้อผิดพลาดในการสร้างโปรโมชั่น กรุณาลองใหม่อีกครั้ง"];
    }
  }
};

// Reset form
const resetForm = () => {
  form.value = {
    name: "",
    description: "",
    discount_percent: 0,
    start_date: "",
    end_date: "",
  };
  selectedUsers.value = [];
  tempStartDate.value = null;
  tempEndDate.value = null;
  tempStartHour.value = "09";
  tempStartMinute.value = "00";
  tempEndHour.value = "18";
  tempEndMinute.value = "00";
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

// Initialize default dates
const initializeDefaultDates = () => {
  const now = new Date();

  // Start date: today at 09:00
  const startDate = new Date(now);
  startDate.setHours(9, 0, 0, 0);
  tempStartDate.value = startDate;
  tempStartHour.value = "09";
  tempStartMinute.value = "00";
  form.value.start_date = startDate.toISOString();

  // End date: tomorrow at 18:00
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 1);
  endDate.setHours(18, 0, 0, 0);
  tempEndDate.value = endDate;
  tempEndHour.value = "18";
  tempEndMinute.value = "00";
  form.value.end_date = endDate.toISOString();
};

// Watch for dialog open to load users
watch(isOpen, (newValue) => {
  if (newValue) {
    loadUsers();
    initializeDefaultDates();
  } else {
    resetForm();
  }
});
</script>
