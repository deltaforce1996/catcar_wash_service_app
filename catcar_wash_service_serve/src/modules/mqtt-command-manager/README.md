# MQTT Command Manager Module

This module provides MQTT command management functionality for sending commands to IoT devices and handling their ACK responses. This is a **service-only module** without REST API endpoints.

## Features

- **Command Lifecycle Management**: Handles command sending, timeout, and ACK responses
- **Multiple Command Types**: Support for APPLY_CONFIG, RESTART, UPDATE_FIRMWARE, RESET_CONFIG
- **Timeout Handling**: Automatic timeout management with configurable timeouts
- **Event-driven**: Emits events for command status changes
- **Service Integration**: Designed to be used by other services in the application

## Command Types

### ACK Required Commands
- `APPLY_CONFIG` - Apply device configuration
- `RESTART` - Restart device
- `UPDATE_FIRMWARE` - Update device firmware
- `RESET_CONFIG` - Reset device to default configuration

### Fire-and-Forget Commands
_None currently supported_

## Usage

### Import the Service

```typescript
import { MqttCommandManagerService } from './modules/mqtt-command-manager';

@Injectable()
export class YourService {
  constructor(private readonly mqttCommandManagerService: MqttCommandManagerService) {}
}
```

### Basic Commands

#### Apply Configuration
```typescript
const result = await this.mqttCommandManagerService.applyConfig('device-001', {
  machine: {
    ACTIVE: true,
    BANKNOTE: true,
    COIN: true,
    QR: true,
    ON_TIME: '8:00',
    OFF_TIME: '16:00',
    SAVE_STATE: true,
  },
  function: {
    sec_per_baht: {
      HP_WATER: 10,
      FOAM: 10,
      // ... other settings
    },
  },
});
```

#### Restart Device
```typescript
const result = await this.mqttCommandManagerService.restartDevice('device-001', 5);
```

#### Update Firmware
```typescript
const result = await this.mqttCommandManagerService.updateFirmware('device-001', {
  url: 'https://example.com/firmware.bin',
  version: '1.2.3',
  sha256: 'hash...',
  size: 972800,
  reboot_after: true,
  timeout_sec: 120,
});
```

### Event Handling

```typescript
this.mqttCommandManagerService.on('command-success', (result) => {
  console.log(`Command ${result.command_id} succeeded`);
});

this.mqttCommandManagerService.on('command-timeout', (result) => {
  console.log(`Command ${result.command_id} timed out`);
});
```

## Command Status

Commands can have the following statuses:

- `SENT` - Command sent successfully (fire-and-forget commands)
- `SUCCESS` - Command completed successfully (ACK received)
- `FAILED` - Command failed (ACK with error received)
- `TIMEOUT` - Command timed out (no ACK received within timeout)
- `ERROR` - Error occurred during command processing

## Configuration

Default configuration:
- **Timeout**: 30 seconds for ACK commands
- **Retry Attempts**: 3 attempts
- **Retry Delay**: 1 second between retries

## MQTT Topics

- **Command Topic**: `device/{device_id}/command`
- **ACK Topic**: `server/{device_id}/ack`

## Architecture

The module follows the command lifecycle pattern:

1. **Topic Creation**: Creates ACK subscription for commands requiring ACK
2. **Command Sending**: Publishes command to device topic
3. **Active Monitoring**: Waits for ACK response with timeout
4. **Topic Cleanup**: Removes ACK subscription after response or timeout

This ensures efficient resource usage and prevents topic accumulation.

## Integration

This module is designed to be used by other services in the application. It does not provide REST API endpoints directly. If you need REST API access, create a separate controller that uses this service.