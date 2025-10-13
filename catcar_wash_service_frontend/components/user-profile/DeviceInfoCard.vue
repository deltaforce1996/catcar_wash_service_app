<template>
  <v-card
    color="surface-container"
    class="h-100 d-flex flex-column"
    rounded="lg"
    elevation="2"
  >
    <v-card-title class="pa-6">
      <div class="d-flex align-center">
        <v-icon color="info" size="24" class="me-3" aria-hidden="true">
          mdi-devices
        </v-icon>
        <span class="text-h6 font-weight-bold">ข้อมูลอุปกรณ์</span>
      </div>
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-6 flex-grow-1 d-flex align-center">
      <div
        class="d-flex flex-wrap justify-space-around ga-4 w-100"
        role="list"
        aria-label="สถิติการใช้งานอุปกรณ์"
      >
        <div class="text-center" style="min-width: 120px" role="listitem">
          <div class="text-h4 font-weight-bold text-primary mb-2">
            {{ total }}
          </div>
          <div class="text-body-2 text-medium-emphasis">อุปกรณ์ทั้งหมด</div>
        </div>
        <v-divider vertical class="d-none d-sm-block" />
        <div class="text-center" style="min-width: 120px" role="listitem">
          <div class="text-h4 font-weight-bold text-success mb-2">
            {{ active }}
          </div>
          <div class="text-body-2 text-medium-emphasis">ใช้งานอยู่</div>
        </div>
        <v-divider vertical class="d-none d-sm-block" />
        <div class="text-center" style="min-width: 120px" role="listitem">
          <div class="text-h4 font-weight-bold text-error mb-2">
            {{ inactive }}
          </div>
          <div class="text-body-2 text-medium-emphasis">หยุดใช้งาน</div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  total?: number;
  active?: number;
  inactive?: number;
}

withDefaults(defineProps<Props>(), {
  total: 0,
  active: 0,
  inactive: 0,
});
</script>
