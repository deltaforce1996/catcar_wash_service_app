# Device Pairing Usage Guide

## Overview

This guide explains how to use the `useDevicePairing` composable and the `ex-pairing-page` for device registration and pairing functionality.

## Files Created

1. **`composables/useDevicePairing.ts`** - Vue composable for device pairing management
2. **`pages/examples/ex-pairing-page.vue`** - Example page demonstrating device pairing functionality

## useDevicePairing Composable

### Features

- **SSE Connection Management**: Automatically handles Server-Sent Events connection
- **State Management**: Tracks scanning status, sessions, and errors
- **Event Handling**: Provides callbacks for various device registration events
- **Session Management**: Manages active and expired registration sessions
- **Auto-cleanup**: Automatically disconnects when component unmounts

### Usage Example

```typescript
import { useDevicePairing } from '~/composables/useDevicePairing'

// In your component
const {
  state,
  isConnected,
  activeSessions,
  startScanning,
  stopScanning,
  clearError,
  clearSessions,
  removeSession,
} = useDevicePairing('http://localhost:3001')

// Start scanning with callbacks
startScanning({
  onConnected: () => console.log('Connected to device service'),
  onRegistrationRequested: (data) => console.log('New device request:', data),
  onRegistrationCompleted: (data) => console.log('Registration completed:', data),
  onError: (error) => console.error('Connection error:', error),
})
```

### State Properties

```typescript
interface DevicePairingState {
  isScanning: boolean          // Whether currently scanning for devices
  sessions: DeviceRegistrationSession[]  // All registration sessions
  currentEvent: DeviceRegistrationEvent | null  // Current registration event
  error: string | null         // Last error message
  lastHeartbeat: string | null // Last heartbeat timestamp
}
```

### Computed Properties

- **`isConnected`**: Boolean indicating if SSE connection is active
- **`activeSessions`**: Array of non-expired registration sessions
- **`expiredSessions`**: Array of expired registration sessions

### Methods

- **`startScanning(callbacks?)`**: Start device scanning with optional callbacks
- **`stopScanning()`**: Stop device scanning
- **`clearError()`**: Clear current error state
- **`clearSessions()`**: Clear all sessions
- **`getSessionByPin(pin)`**: Get session by PIN
- **`removeSession(pin)`**: Remove specific session

## Example Page Features

The `ex-pairing-page.vue` demonstrates:

### Control Panel
- Start/Stop scanning button
- Clear sessions button
- Clear error button

### Status Panel
- Connection status indicator
- Scanning status
- Last heartbeat timestamp
- Session counts

### Real-time Display
- Current registration event details
- Active sessions with device information
- Event log with timestamps

### Event Handling
- Registration requests
- Registration completions
- Registration cancellations
- Registration expirations
- Connection status changes

## SSE Events Supported

1. **`initial`**: Initial session data when connected
2. **`registration_requested`**: New device registration request
3. **`registration_completed`**: Device registration completed
4. **`registration_cancelled`**: Registration cancelled by device
5. **`registration_expired`**: Registration session expired
6. **`heartbeat`**: Periodic heartbeat from server

## Configuration

The composable uses the following configuration:

```typescript
// SSE Configuration
{
  url: `${baseURL}/api/v1/devices/scan`,
  withCredentials: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
}
```

## Error Handling

The composable provides comprehensive error handling:

- Connection errors are captured and displayed
- Automatic reconnection with exponential backoff
- Manual error clearing functionality
- Error state tracking in reactive state

## Best Practices

1. **Always cleanup**: The composable automatically disconnects on unmount
2. **Handle errors**: Provide error callbacks for better UX
3. **Monitor sessions**: Use computed properties to track active/expired sessions
4. **Provide feedback**: Show connection status and events to users
5. **Test thoroughly**: Use the example page to test all functionality

## API Endpoints

The composable expects the following API endpoint:

- **GET** `/api/v1/devices/scan` - SSE endpoint for device registration events

## Dependencies

- Vue 3 Composition API
- Device Registration SSE Service
- Device API Service Types
- Vuetify 3 (for the example page)

## Troubleshooting

### Common Issues

1. **Connection fails**: Check if the backend service is running
2. **No events received**: Verify the SSE endpoint is working
3. **Sessions not updating**: Check callback implementations
4. **Memory leaks**: Ensure proper cleanup on component unmount

### Debug Tips

1. Check browser console for SSE connection logs
2. Monitor network tab for SSE connection status
3. Use the event log in the example page to track events
4. Verify API base URL configuration

