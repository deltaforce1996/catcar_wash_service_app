<!-- eslint-disable vue/valid-v-model -->
<template>
  <v-container fluid class="pa-8">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <!-- Header Card -->
        <v-card class="mb-6" elevation="2">
          <v-card-title class="text-h5 font-weight-bold">
            <v-icon left>mdi-account</v-icon>
            โปรไฟล์ของฉัน
          </v-card-title>
        </v-card>

        <!-- Debug Info (for development) -->
        <v-card class="mt-6" elevation="1">
          <v-card-title class="text-subtitle-1">
            <v-icon left>mdi-bug</v-icon>
            Debug Info
          </v-card-title>
          <v-card-text>
            <div class="mb-4">
              <h4 class="text-subtitle-2 mb-2">User Data:</h4>
              <pre
                class="text-caption overflow-auto bg-grey-lighten-4 p-2 rounded"
                >{{ JSON.stringify(user, null, 2) }}</pre
              >
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";

// Meta
// definePageMeta({
//   middleware: 'auth'
// })

// Auth composable
const { user } = useAuth();
</script>
