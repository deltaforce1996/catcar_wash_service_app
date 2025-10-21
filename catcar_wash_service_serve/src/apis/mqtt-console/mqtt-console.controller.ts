import { Controller, Get, Query, Res, Sse, MessageEvent, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { MqttConsoleService, MqttConsoleMessage } from './mqtt-console.service';
import * as path from 'path';
import * as fs from 'fs';

@Controller('mqtt-console')
export class MqttConsoleController {
  private readonly logger = new Logger(MqttConsoleController.name);

  constructor(private readonly mqttConsoleService: MqttConsoleService) {}

  /**
   * Serve HTML console page
   */
  @Get()
  getConsolePage(@Res() res: import('express').Response) {
    const htmlPath = path.join(process.cwd(), 'public', 'mqtt-console.html');

    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      // Fallback if HTML file doesn't exist
      res.setHeader('Content-Type', 'text/html');
      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MQTT Console - File Not Found</title>
</head>
<body>
    <h1>MQTT Console HTML File Not Found</h1>
    <p>Please ensure the file exists at: ${htmlPath}</p>
</body>
</html>
      `);
    }
  }

  /**
   * Server-Sent Events stream for real-time MQTT messages
   */
  @Sse('stream')
  streamMessages(): Observable<MessageEvent> {
    return new Observable((observer) => {
      this.logger.log('New SSE client connected');

      // Send recent messages on connect
      const recentMessages = this.mqttConsoleService.getRecentMessages(100);
      recentMessages.forEach((message) => {
        observer.next({
          data: JSON.stringify(message),
        } as MessageEvent);
      });

      // Subscribe to new messages
      const unsubscribe = this.mqttConsoleService.subscribe((message: MqttConsoleMessage) => {
        try {
          observer.next({
            data: JSON.stringify(message),
          } as MessageEvent);
        } catch (error) {
          this.logger.error('Error sending SSE message:', error);
        }
      });

      // Cleanup on disconnect
      return () => {
        this.logger.log('SSE client disconnected');
        unsubscribe();
      };
    });
  }

  /**
   * Get recent messages as JSON (REST API)
   */
  @Get('messages')
  getMessages(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return {
      messages: this.mqttConsoleService.getRecentMessages(limitNum),
      count: this.mqttConsoleService.getMessageCount(),
      subscribers: this.mqttConsoleService.getSubscriberCount(),
    };
  }

  /**
   * Get console statistics
   */
  @Get('stats')
  getStats() {
    return {
      messageCount: this.mqttConsoleService.getMessageCount(),
      subscriberCount: this.mqttConsoleService.getSubscriberCount(),
    };
  }

  /**
   * Get list of unique topics
   */
  @Get('topics')
  getTopics() {
    return {
      topics: this.mqttConsoleService.getUniqueTopics(),
    };
  }
}
