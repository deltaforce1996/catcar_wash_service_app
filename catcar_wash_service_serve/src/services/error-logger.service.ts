import { Injectable, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import timezoneConfig from 'src/configs/timezone.config';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ErrorLoggerService {
  constructor(
    @Inject(timezoneConfig.KEY)
    private readonly tzConfig: ConfigType<typeof timezoneConfig>,
  ) {}

  logErrorToFile(error: Error, request: Request): void {
    // Use configured timezone (default: Asia/Bangkok UTC+7)
    const now = new Date();
    const thailandTime = new Date(now.getTime() + this.tzConfig.offsetMs);
    const timestamp = thailandTime.toISOString().replace('T', ' ').replace('Z', ' +07:00');

    const userAgent = request.get('User-Agent') || '-';
    const ip = request.ip || '-';

    // Format like nginx error log
    const logLine = `${timestamp} [error] ${request.method} ${request.url} - ${error.message}\n`;
    const stackTrace = error.stack ? `${error.stack}\n` : '';
    const requestInfo = `IP: ${ip} | User-Agent: ${userAgent}\n`;
    const separator = '---\n';

    const logText = logLine + requestInfo + stackTrace + separator;

    // Create logging/errors directory structure
    const logDir = path.join(process.cwd(), 'logging', 'errors');
    // Use Thailand date for filename
    const dateStr = thailandTime.toISOString().split('T')[0];
    const logFileName = `error-${dateStr}.txt`;
    const logFilePath = path.join(logDir, logFileName);

    try {
      // Create directories if they don't exist
      fs.mkdirSync(logDir, { recursive: true });

      // Append to daily log file
      fs.appendFileSync(logFilePath, logText);
    } catch (writeError) {
      console.error('Failed to write to log file:', writeError);
    }
  }
}
