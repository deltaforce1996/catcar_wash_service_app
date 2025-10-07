# MQTT Command Manager - Usage Guide

## Quick Start

### 1. Import the Service

```typescript
import { MqttCommandManagerService } from './modules/mqtt-command-manager';

@Injectable()
export class YourService {
  constructor(private readonly mqttCommandManagerService: MqttCommandManagerService) {}
}
```

### 2. Basic Commands

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

### 3. Event Handling

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

## Error Handling

```typescript
try {
  const result = await this.mqttCommandManagerService.applyConfig('device-001', config);
  
  if (result.status === 'SUCCESS') {
    console.log('Configuration applied successfully');
  } else if (result.status === 'TIMEOUT') {
    console.log('Device did not respond within timeout');
  } else {
    console.log('Command failed:', result.error);
  }
} catch (error) {
  console.error('Service error:', error);
}
```

## Best Practices

1. **Always handle timeouts**: Commands can timeout if devices are offline
2. **Monitor events**: Set up event listeners for real-time status updates
3. **Handle errors gracefully**: Check command status and handle failures appropriately
4. **Use appropriate timeouts**: Adjust timeout based on command complexity

## Troubleshooting

### Command Timeout
- Check device connectivity
- Verify MQTT broker connection
- Increase timeout if needed

### ACK Not Received
- Verify device is listening on correct topic
- Check device logs for errors
- Ensure device is online

### Configuration Errors
- Validate configuration format
- Check device-specific requirements
- Use configuration templates as reference

## Service Integration

This service is designed to be used by other services in your application. Example integration:

```typescript
@Injectable()
export class DeviceManagementService {
  constructor(
    private readonly mqttCommandManagerService: MqttCommandManagerService,
    private readonly deviceService: DeviceService,
  ) {}

  async updateDeviceConfiguration(deviceId: string, config: any) {
    // Update device in database
    await this.deviceService.updateConfig(deviceId, config);
    
    // Send command to device
    const result = await this.mqttCommandManagerService.applyConfig(deviceId, config);
    
    if (result.status === 'SUCCESS') {
      await this.deviceService.markConfigApplied(deviceId);
    }
    
    return result;
  }
}
```