<template>
  <v-row>
    <!-- Personal Information Card -->
    <v-col cols="12">
      <PersonalInfoCard
        :fullname="user?.fullname"
        :custom-name="user?.custom_name"
        :email="user?.email"
        :phone="user?.phone"
        :address="user?.address"
      />
    </v-col>

    <!-- Device Information Card -->
    <v-col cols="12" lg="6">
      <DeviceInfoCard
        :total="user?.device_counts?.total"
        :active="user?.device_counts?.active"
        :inactive="user?.device_counts?.inactive"
      />
    </v-col>

    <!-- Account Status Card -->
    <v-col cols="12" lg="6">
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
import PersonalInfoCard from "./PersonalInfoCard.vue";
import DeviceInfoCard from "./DeviceInfoCard.vue";
import AccountStatusCard from "./AccountStatusCard.vue";

interface Props {
  user?: AuthenticatedUser | null;
}

defineProps<Props>();
</script>
