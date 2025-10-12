<template>
  <v-row>
    <!-- Employee Personal Information Card -->
    <v-col cols="12">
      <EmployeePersonalInfoCard
        :name="user?.name"
        :email="user?.email"
        :phone="user?.phone"
        :line="user?.line"
        :address="user?.address"
      />
    </v-col>

    <!-- Account Status Card -->
    <v-col cols="12">
      <AccountStatusCard
        :status="user?.status"
        :created-at="user?.created_at"
        :updated-at="user?.updated_at"
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { AuthenticatedUser } from "~/services/apis/auth-api.service";
import EmployeePersonalInfoCard from "./EmployeePersonalInfoCard.vue";
import AccountStatusCard from "./AccountStatusCard.vue";

interface Props {
  user?: AuthenticatedUser | null;
}

defineProps<Props>();
</script>
