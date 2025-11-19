<template>
  <v-dialog v-model="isOpen" max-width="900" persistent>
    <v-card>
      <v-card-title class="pa-6">
        <h3 class="text-h5">แก้ไขโปรโมชั่น</h3>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
          <v-row>
            <!-- Active Status Toggle -->
            <v-col cols="12">
              <v-switch
                v-model="form.is_active"
                color="primary"
                label="เปิดใช้งานโปรโมชั่น"
                hide-details
              />
            </v-col>

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

            <v-col cols="12" md="6" />

            <!-- Start Date -->
            <v-col cols="12" md="6">
              <v-menu v-model="startDateMenu" :close-on-content-click="false" location="bottom">
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
                  <v-date-picker v-model="tempStartDate" hide-header />
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
                    <v-btn variant="text" size="small" @click="startDateMenu = false">
                      ยกเลิก
                    </v-btn>
                    <v-spacer />
                    <v-btn color="primary" size="small" @click="confirmStartDateTime">
                      ยืนยัน
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-menu>
            </v-col>

            <!-- End Date -->
            <v-col cols="12" md="6">
              <v-menu v-model="endDateMenu" :close-on-content-click="false" location="bottom">
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
                  <v-date-picker v-model="tempEndDate" hide-header />
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
                    <v-btn variant="text" size="small" @click="endDateMenu = false">
                      ยกเลิก
                    </v-btn>
                    <v-spacer />
                    <v-btn color="primary" size="small" @click="confirmEndDateTime">
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
                  <v-chip v-bind="props" color="primary" size="small" variant="tonal">
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
        <v-btn variant="outlined" :disabled="isUpdating" @click="handleClose">
          ยกเลิก
        </v-btn>
        <v-btn color="primary" variant="flat" :loading="isUpdating" @click="handleUpdateClick">
          บันทึก
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { PromotionResponseApi } from "~/types";
import { usePromotion } from "~/composables/usePromotion";
import { useUser } from "~/composables/useUser";

// Props
interface Props {
  modelValue: boolean;
  promotion: PromotionResponseApi | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
}>();

// Composables
const { updatePromotionById, isUpdating, error } = usePromotion();
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
  is_active: boolean;
}

const form = ref<PromotionForm>({
  name: "",
  description: "",
  discount_percent: 0,
  start_date: "",
  end_date: "",
  is_active: true,
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
      limit: 1000,
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการโหลดรายชื่อลูกค้า:", err);
  } finally {
    isLoadingUsers.value = false;
  }
};

// Load promotion data into form
const loadPromotionData = () => {
  if (!props.promotion) return;

  // Check if dates are valid
  const hasValidStartDate = props.promotion.start_date && props.promotion.start_date !== "";
  const hasValidEndDate = props.promotion.end_date && props.promotion.end_date !== "";

  // If dates are invalid, set defaults
  let startDateValue = props.promotion.start_date;
  let endDateValue = props.promotion.end_date;

  if (!hasValidStartDate || !hasValidEndDate) {
    const now = new Date();
    if (!hasValidStartDate) {
      const defaultStart = new Date(now);
      defaultStart.setHours(9, 0, 0, 0);
      startDateValue = defaultStart.toISOString();
    }
    if (!hasValidEndDate) {
      const defaultEnd = new Date(now);
      defaultEnd.setDate(defaultEnd.getDate() + 1);
      defaultEnd.setHours(18, 0, 0, 0);
      endDateValue = defaultEnd.toISOString();
    }
  }

  form.value = {
    name: props.promotion.name,
    description: props.promotion.description || "",
    discount_percent: Number(props.promotion.discount_percent),
    start_date: startDateValue,
    end_date: endDateValue,
    is_active: props.promotion.is_active,
  };

  // Set temp date/time values
  const startDate = new Date(startDateValue);
  const endDate = new Date(endDateValue);

  tempStartDate.value = startDate;
  tempEndDate.value = endDate;
  tempStartHour.value = startDate.getHours().toString().padStart(2, "0");
  tempStartMinute.value = startDate.getMinutes().toString().padStart(2, "0");
  tempEndHour.value = endDate.getHours().toString().padStart(2, "0");
  tempEndMinute.value = endDate.getMinutes().toString().padStart(2, "0");

  // Set selected users
  selectedUsers.value = props.promotion.assigned_users.map((au) => ({
    title: `${au.user.fullname} (${au.user.email})`,
    value: au.user.id,
  }));
};

// Handle update button click
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
  if (!props.promotion) return;

  try {
    const payload = {
      name: form.value.name,
      description: form.value.description || undefined,
      discount_percent: form.value.discount_percent,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      is_active: form.value.is_active,
      user_ids: selectedUsers.value.map((u) => u.value),
    };

    await updatePromotionById(props.promotion.id, payload);

    // Success - emit success event and close dialog
    emit("success");
    handleClose();
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการอัปเดตโปรโมชั่น:", err);
    if (error.value) {
      formErrors.value = [error.value];
    } else {
      formErrors.value = ["เกิดข้อผิดพลาดในการอัปเดตโปรโมชั่น กรุณาลองใหม่อีกครั้ง"];
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
    is_active: true,
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

// Watch for dialog open to load promotion data and users
watch(isOpen, (newValue) => {
  if (newValue) {
    loadUsers();
    loadPromotionData();
  } else {
    resetForm();
  }
});

// Watch for promotion changes
watch(
  () => props.promotion,
  () => {
    if (isOpen.value) {
      loadPromotionData();
    }
  }
);
</script>
