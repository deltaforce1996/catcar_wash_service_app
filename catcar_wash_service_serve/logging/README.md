# Logging Directory Structure

This directory contains application logs organized by type and date.

## Directory Structure

```
logging/
├── errors/           # HTTP/API error logs
│   └── error-YYYY-MM-DD.txt
├── mqtt/            # MQTT connection and communication logs
│   └── mqtt-YYYY-MM-DD.txt
└── README.md        # This file
```

## MQTT Logs

MQTT logs are stored in the `mqtt/` directory with daily rotation. Each log entry includes:

- **Timestamp**: Thailand timezone (UTC+7)
- **Log Type**: connection_error, publish_error, subscribe_error, unsubscribe_error
- **Message**: Descriptive error message
- **Topic**: MQTT topic (if applicable)
- **Client ID**: MQTT client identifier
- **Error Details**: Error message and stack trace (if available)

### Example MQTT Log Entry

```
2024-01-15 14:30:25.123 +07:00 [mqtt-connection_error] MQTT client is not connected - cannot publish message
Topic: server/device123/streaming
Client ID: catcar-wash-1705312225123
---
```

## Error Logs

Error logs follow a similar format but are focused on HTTP/API errors with request context information.

## Log Rotation

Logs are automatically rotated daily at midnight Thailand time. Old log files are kept indefinitely unless manually cleaned up.
