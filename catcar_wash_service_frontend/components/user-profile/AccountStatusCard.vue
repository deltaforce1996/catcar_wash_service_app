<template>
  <v-card
    color="surface-container"
    class="h-100"
    rounded="lg"
    elevation="2"
  >
    <v-card-title class="pa-6">
      <div class="d-flex align-center">
        <v-icon color="secondary" size="24" class="me-3" aria-hidden="true">
          mdi-shield-check
        </v-icon>
        <span class="text-h6 font-weight-bold">สถานะบัญชี</span>
      </div>
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-6">
      <div class="d-flex flex-column ga-5">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">สถานะบัญชี</div>
          <v-chip
            :color="getStatusColor(status)"
            variant="tonal"
            size="small"
            :aria-label="`สถานะบัญชี: ${getStatusLabel(status)}`"
          >
            {{ getStatusLabel(status) }}
          </v-chip>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">
            วันที่สมัครสมาชิก
          </div>
          <div class="text-body-1 font-weight-medium">
            {{ formatDate(createdAt) }}
          </div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">อัปเดตล่าสุด</div>
          <div class="text-body-1 font-weight-medium">
            {{ formatDate(updatedAt) }}
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

withDefaults(defineProps<Props>(), {
  status: "ACTIVE",
  createdAt: "",
  updatedAt: "",
});

const getStatusColor = (status: string) => {
  return status === "ACTIVE" ? "success" : "error";
};

const getStatusLabel = (status: string) => {
  return status === "ACTIVE" ? "ใช้งานอยู่" : "หยุดใช้งาน";
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
</script>
