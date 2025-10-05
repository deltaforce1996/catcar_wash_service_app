<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3" color="primary">mdi-bluetooth-connect</v-icon>
            <span class="text-h5">Device Pairing Example</span>
          </v-card-title>
          <v-card-subtitle>
            Test device registration and pairing functionality
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- Control Panel -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-cog</v-icon>
            Control Panel
          </v-card-title>
          <v-card-text>
            <v-btn
              :color="state.isScanning ? 'error' : 'success'"
              :loading="state.isScanning"
              block
              large
              class="mb-4"
              @click="toggleScanning"
            >
              <v-icon class="mr-2">
                {{ state.isScanning ? 'mdi-stop' : 'mdi-play' }}
              </v-icon>
              {{ state.isScanning ? 'Stop Scanning' : 'Start Scanning' }}
            </v-btn>

            <v-divider class="my-4"/>

            <v-btn
              color="warning"
              variant="outlined"
              block
              class="mb-2"
              @click="clearSessions"
            >
              <v-icon class="mr-2">mdi-delete-sweep</v-icon>
              Clear Sessions
            </v-btn>

            <v-btn
              v-if="state.error"
              color="info"
              variant="outlined"
              block
              @click="clearError"
            >
              <v-icon class="mr-2">mdi-close-circle</v-icon>
              Clear Error
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Status Panel -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-information</v-icon>
            Status
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Connection Status</v-list-item-title>
                <template #append>
                  <v-chip
                    :color="isConnected ? 'success' : 'error'"
                    size="small"
                  >
                    {{ isConnected ? 'Connected' : 'Disconnected' }}
                  </v-chip>
                </template>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Scanning Status</v-list-item-title>
                <template #append>
                  <v-chip
                    :color="state.isScanning ? 'primary' : 'grey'"
                    size="small"
                  >
                    {{ state.isScanning ? 'Active' : 'Inactive' }}
                  </v-chip>
                </template>
              </v-list-item>

              <v-list-item v-if="state.lastHeartbeat">
                <v-list-item-title>Last Heartbeat</v-list-item-title>
                <template #append>
                  <span class="text-caption">
                    {{ formatTimestamp(state.lastHeartbeat) }}
                  </span>
                </template>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Active Sessions</v-list-item-title>
                <template #append>
                  <v-chip color="success" size="small">
                    {{ activeSessions.length }}
                  </v-chip>
                </template>
              </v-list-item>

              <v-list-item>
                <v-list-item-title>Total Sessions</v-list-item-title>
                <template #append>
                  <v-chip color="primary" size="small">
                    {{ state.sessions.length }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-row v-if="state.error">
      <v-col cols="12">
        <v-alert
          type="error"
          variant="tonal"
          closable
          @click:close="clearError"
        >
          <v-alert-title>Connection Error</v-alert-title>
          {{ state.error }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Device List -->
    <v-row v-if="state.sessions.length > 0">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-devices</v-icon>
            Device Registration Sessions
            <v-chip color="primary" class="ml-2">{{ state.sessions.length }}</v-chip>
          </v-card-title>
          <v-card-text>
            <v-data-iterator
              :items="state.sessions"
              :items-per-page="10"
            >
              <template #default="{ items }">
                <v-row>
                  <v-col
                    v-for="session in items"
                    :key="session.raw.pin"
                    cols="12"
                    md="6"
                    lg="4"
                  >
                    <v-card variant="outlined" class="h-100">
                      <v-card-title class="text-h6">
                        <v-icon class="mr-2" color="primary">mdi-circle</v-icon>
                        PIN: {{ session.raw.pin }}
                      </v-card-title>
                      <v-card-text>
                        <v-list density="compact">
                          <v-list-item>
                            <v-list-item-title>MAC Address</v-list-item-title>
                            <template #append>
                              <span class="text-caption">{{ session.raw.mac_address }}</span>
                            </template>
                          </v-list-item>
                          <v-list-item>
                            <v-list-item-title>Chip ID</v-list-item-title>
                            <template #append>
                              <span class="text-caption">{{ session.raw.chip_id }}</span>
                            </template>
                          </v-list-item>
                          <v-list-item>
                            <v-list-item-title>Firmware</v-list-item-title>
                            <template #append>
                              <span class="text-caption">{{ session.raw.firmware_version }}</span>
                            </template>
                          </v-list-item>
                          <v-list-item>
                            <v-list-item-title>Created</v-list-item-title>
                            <template #append>
                              <span class="text-caption">{{ formatTimestamp(session.raw.created_at) }}</span>
                            </template>
                          </v-list-item>
                          <v-list-item>
                            <v-list-item-title>Expires</v-list-item-title>
                            <template #append>
                              <span class="text-caption">{{ formatTimestamp(session.raw.expires_at) }}</span>
                            </template>
                          </v-list-item>
                        </v-list>
                      </v-card-text>
                      <v-card-actions>
                        <v-btn
                          color="error"
                          variant="outlined"
                          size="small"
                          @click="removeSession(session.raw.pin)"
                        >
                          <v-icon class="mr-1">mdi-delete</v-icon>
                          Remove
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </v-row>
              </template>
            </v-data-iterator>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>


    <!-- Event Log -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-history</v-icon>
            Event Log
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item
                v-for="(event, index) in eventLog"
                :key="index"
                :prepend-icon="getEventIcon(event.type)"
              >
                <v-list-item-title>{{ event.message }}</v-list-item-title>
                <v-list-item-subtitle>{{ formatTimestamp(event.timestamp) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="eventLog.length === 0">
                <v-list-item-title class="text-grey">No events yet</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="warning"
              variant="outlined"
              size="small"
              @click="clearEventLog"
            >
              <v-icon class="mr-1">mdi-delete-sweep</v-icon>
              Clear Log
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDevicePairing } from '~/composables/useDevicePairing'

// Define page metadata
definePageMeta({
  layout: 'default',
  title: 'Device Pairing Example'
})

const baseURL: string = 'http://localhost:3000'

// Device pairing composable
const {
  state,
  isConnected,
  activeSessions,
  startScanning,
  stopScanning,
  clearError,
  clearSessions,
  removeSession,
} = useDevicePairing(baseURL)

// Event log
const eventLog = ref<Array<{
  type: string
  message: string
  timestamp: string
}>>([])

// Methods
const toggleScanning = () => {
  if (state.value.isScanning) {
    stopScanning()
    addEventLog('info', 'Scanning stopped')
  } else {
    startScanning({
      onConnected: () => {
        addEventLog('success', 'Connected to device registration service')
      },
      onDisconnected: () => {
        addEventLog('warning', 'Disconnected from device registration service')
      },
      onRegistrationRequested: (data) => {
        addEventLog('info', `Registration requested for PIN: ${data.pin}`)
      },
      onRegistrationCompleted: (data) => {
        addEventLog('success', `Registration completed for PIN: ${data.pin}`)
      },
      onRegistrationCancelled: (data) => {
        addEventLog('warning', `Registration cancelled for PIN: ${data.pin}`)
      },
      onRegistrationExpired: (data) => {
        addEventLog('error', `Registration expired for PIN: ${data.pin}`)
      },
      onSessionsUpdated: (sessions) => {
        const sessionCount = Array.isArray(sessions) ? sessions.length : 0
        addEventLog('info', `Sessions updated: ${sessionCount} active sessions`)
      },
      onError: (error) => {
        addEventLog('error', `Connection error: ${error.type}`)
      },
    })
    addEventLog('info', 'Scanning started')
  }
}

const addEventLog = (type: string, message: string) => {
  eventLog.value.unshift({
    type,
    message,
    timestamp: new Date().toISOString(),
  })
  
  // Keep only last 50 events
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(0, 50)
  }
}

const clearEventLog = () => {
  eventLog.value = []
}

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString()
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'success':
      return 'mdi-check-circle'
    case 'error':
      return 'mdi-alert-circle'
    case 'warning':
      return 'mdi-alert'
    case 'info':
    default:
      return 'mdi-information'
  }
}
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}
</style>
