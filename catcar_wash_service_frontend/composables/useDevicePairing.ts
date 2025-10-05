import { ref, computed, onUnmounted, readonly } from 'vue'
import { DeviceRegistrationSSEService, type DeviceRegistrationSSECallbacks } from '~/services/device-registration-sse.service'
import type { DeviceRegistrationSession } from '~/services/apis/device-api.service'

export interface DevicePairingState {
  isScanning: boolean
  sessions: DeviceRegistrationSession[]
  error: string | null
  lastHeartbeat: string | null
}

export interface DevicePairingCallbacks {
  onRegistrationRequested?: (data: DeviceRegistrationSession) => void
  onRegistrationCompleted?: (data: DeviceRegistrationSession) => void
  onRegistrationCancelled?: (data: DeviceRegistrationSession) => void
  onRegistrationExpired?: (data: DeviceRegistrationSession) => void
  onSessionsUpdated?: (sessions: DeviceRegistrationSession[]) => void
  onError?: (error: Event) => void
  onConnected?: () => void
  onDisconnected?: () => void
}

export function useDevicePairing(baseURL: string = '') {
  // State
  const state = ref<DevicePairingState>({
    isScanning: false,
    sessions: [],
    error: null,
    lastHeartbeat: null,
  })

  // Service instance
  let sseService: DeviceRegistrationSSEService | null = null

  // Computed
  const isConnected = computed(() => state.value.isScanning && sseService?.isConnected)
  const activeSessions = computed(() => {
    if (!Array.isArray(state.value.sessions)) return []
    return state.value.sessions.filter(session => {
      if (!session || !session.expires_at) return false
      const expiresAt = new Date(session.expires_at)
      return expiresAt > new Date()
    })
  })
  const expiredSessions = computed(() => {
    if (!Array.isArray(state.value.sessions)) return []
    return state.value.sessions.filter(session => {
      if (!session || !session.expires_at) return false
      const expiresAt = new Date(session.expires_at)
      return expiresAt <= new Date()
    })
  })

  // Methods
  const startScanning = (callbacks?: DevicePairingCallbacks) => {
    if (state.value.isScanning) {
      console.warn('Device pairing is already scanning')
      return
    }

    try {
      sseService = new DeviceRegistrationSSEService(baseURL)
      
      const sseCallbacks: DeviceRegistrationSSECallbacks = {
        onInitial: (sessions: DeviceRegistrationSession[]) => {
          console.log('Received initial sessions:', sessions)
          state.value.sessions = Array.isArray(sessions) ? sessions : []
          callbacks?.onSessionsUpdated?.(state.value.sessions)
        },
        
        onRegistrationRequested: (data: DeviceRegistrationSession) => {
          // Add new session to list
          const existingIndex = state.value.sessions.findIndex(s => s.pin === data.pin)
          if (existingIndex === -1) {
            state.value.sessions.push(data)
          } else {
            state.value.sessions[existingIndex] = data
          }
          callbacks?.onRegistrationRequested?.(data)
        },
        
        onRegistrationCompleted: (data: DeviceRegistrationSession) => {
          // Update session in list
          const existingIndex = state.value.sessions.findIndex(s => s.pin === data.pin)
          if (existingIndex !== -1) {
            state.value.sessions[existingIndex] = data
          }
          callbacks?.onRegistrationCompleted?.(data)
        },
        
        onRegistrationCancelled: (data: DeviceRegistrationSession) => {
          // Remove cancelled session from list
          if (Array.isArray(state.value.sessions)) {
            state.value.sessions = state.value.sessions.filter(
              session => session && session.pin !== data.pin
            )
          }
          callbacks?.onRegistrationCancelled?.(data)
        },
        
        onRegistrationExpired: (data: DeviceRegistrationSession) => {
          // Remove expired session from list
          if (Array.isArray(state.value.sessions)) {
            state.value.sessions = state.value.sessions.filter(
              session => session && session.pin !== data.pin
            )
          }
          callbacks?.onRegistrationExpired?.(data)
        },
        
        onHeartbeat: (data: { timestamp: string }) => {
          state.value.lastHeartbeat = data.timestamp
        },
        
        onOpen: () => {
          state.value.isScanning = true
          state.value.error = null
          callbacks?.onConnected?.()
        },
        
        onError: (error: Event) => {
          state.value.error = 'Connection error occurred'
          callbacks?.onError?.(error)
        },
        
        onClose: () => {
          state.value.isScanning = false
          callbacks?.onDisconnected?.()
        },
      }

      sseService.startScanning(sseCallbacks)
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to start scanning'
      console.error('Failed to start device pairing scan:', error)
    }
  }

  const stopScanning = () => {
    if (sseService) {
      sseService.stopScanning()
      sseService = null
    }
    state.value.isScanning = false
  }

  const clearError = () => {
    state.value.error = null
  }

  const clearSessions = () => {
    state.value.sessions = []
  }

  const getSessionByPin = (pin: string) => {
    return state.value.sessions.find(session => session.pin === pin)
  }

  const removeSession = (pin: string) => {
    state.value.sessions = state.value.sessions.filter(
      session => session.pin !== pin
    )
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopScanning()
  })

  return {
    // State
    state: readonly(state),
    
    // Computed
    isConnected,
    activeSessions,
    expiredSessions,
    
    // Methods
    startScanning,
    stopScanning,
    clearError,
    clearSessions,
    getSessionByPin,
    removeSession,
  }
}
