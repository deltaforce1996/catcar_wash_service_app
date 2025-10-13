<template>
  <div>
    <!-- Header Section -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center flex-wrap">
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">โปรไฟล์ผู้ใช้งาน</h1>
          </div>
          <div
            v-if="isUser"
            class="d-flex align-center ga-3 flex-wrap"
            role="group"
            aria-label="การดำเนินการโปรไฟล์"
          >
            <v-btn
              variant="outlined"
              prepend-icon="mdi-key-variant"
              class="text-none"
              aria-label="ตั้งค่า API Key"
              @click="openPaymentDialog"
            >
              ตั้งค่า API Key
            </v-btn>
          </div>
        </div>
      </v-col>

      <!-- Profile Cards Section -->
      <v-col cols="12">
        <!-- User Profile Section -->
        <ProfileCardsSection v-if="isUser" :user="user" />

        <!-- Employee/Technician Profile Section -->
        <EmployeeProfileCardsSection
          v-else-if="isEmployee || isAdmin"
          :user="user"
        />
      </v-col>
    </v-row>

    <!-- Payment Info Dialog -->
    <PaymentInfoDialog
      v-model="paymentDialog"
      :current-values="user?.payment_info"
      :loading="isUpdatingPayment"
      :api-error="paymentError"
      @confirm="handleUpdatePaymentInfo"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "~/composables/useAuth";
import ProfileCardsSection from "~/components/user-profile/ProfileCardsSection.vue";
import EmployeeProfileCardsSection from "~/components/user-profile/EmployeeProfileCardsSection.vue";
import PaymentInfoDialog from "~/components/user-profile/PaymentInfoDialog.vue";

// Page metadata
definePageMeta({
  title: "โปรไฟล์ผู้ใช้งาน",
  layout: "default",
});

// Auth composable
const { user, isUser, isEmployee, isAdmin, updateProfile } = useAuth();

// Payment dialog state
const paymentDialog = ref(false);
const isUpdatingPayment = ref(false);
const paymentError = ref("");

// Action handlers
const openPaymentDialog = () => {
  paymentError.value = "";
  paymentDialog.value = true;
};

const handleUpdatePaymentInfo = async (paymentInfo: {
  merchant_id?: string;
  api_key?: string;
  HMAC_key?: string;
}) => {
  isUpdatingPayment.value = true;
  paymentError.value = "";

  try {
    await updateProfile({
      payment_info: paymentInfo,
    });
    // Only close dialog on success
    paymentDialog.value = false;
  } catch (error: any) {
    console.error("Failed to update payment info:", error);
    // Set error message for dialog to display
    paymentError.value =
      error?.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูลการชำระเงิน";
  } finally {
    isUpdatingPayment.value = false;
  }
};
</script>

<style scoped>
/* Typography enhancements for consistent styling */
.text-h4,
.text-h5,
.text-h6 {
  letter-spacing: -0.01em;
}

.text-body-1 {
  line-height: 1.6;
}

.text-caption {
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 500;
}

/* Responsive Typography */
@media (max-width: 960px) {
  h1.text-h4 {
    font-size: 1.5rem !important;
  }
}

@media (max-width: 600px) {
  h1.text-h4 {
    font-size: 1.25rem !important;
  }
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
