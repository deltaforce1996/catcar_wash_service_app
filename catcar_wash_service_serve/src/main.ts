import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTimeTransformInterceptor } from './common';
import { DateTimeService } from './services';
import { join } from 'path';
import * as https from 'https';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger(AppModule.name);

  app.enableCors();

  // Serve static files from public directory
  app.useStaticAssets(join(process.cwd(), 'public'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Register global DateTime interceptor to convert Date objects to Thai format
  const dateTimeService = app.get(DateTimeService);
  app.useGlobalInterceptors(new DateTimeTransformInterceptor(dateTimeService));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port');
  const httpsPort = configService.get<number>('app.httpsPort');

  // Start HTTP server
  logger.log(`Server is running on port ${port} in ${configService.get<string>('app.environment')} mode`);
  await app.listen(port ?? 3000);

  // Configure HTTP server timeouts for long-lived connections (SSE)
  const httpServer = app.getHttpServer();
  httpServer.keepAliveTimeout = 65000; // 65 seconds (มากกว่า Cloudflare 60s timeout และ SSE heartbeat 30s)
  httpServer.headersTimeout = 66000; // 66 seconds (ต้องมากกว่า keepAliveTimeout)
  logger.log(`HTTP Keep-Alive timeout: ${httpServer.keepAliveTimeout}ms`);
  logger.log(`HTTP Headers timeout: ${httpServer.headersTimeout}ms`);

  // Start HTTPS server if certificates exist
  try {
    const httpsOptions = {
      key: fs.readFileSync(join(process.cwd(), 'https', 'server.key')),
      cert: fs.readFileSync(join(process.cwd(), 'https', 'server.cert')),
    };

    const httpsServer = https.createServer(httpsOptions, app.getHttpAdapter().getInstance());
    
    // Configure HTTPS server timeouts (same as HTTP)
    httpsServer.keepAliveTimeout = 65000; // 65 seconds
    httpsServer.headersTimeout = 66000; // 66 seconds
    
    httpsServer.listen(httpsPort ?? 3005);
    logger.log(
      `HTTPS Server is running on port ${httpsPort ?? 3005} in ${configService.get<string>('app.environment')} mode`,
    );
    logger.log(`HTTPS Keep-Alive timeout: ${httpsServer.keepAliveTimeout}ms`);
    logger.log(`HTTPS Headers timeout: ${httpsServer.headersTimeout}ms`);
  } catch (error) {
    logger.warn('HTTPS server could not start. Make sure certificates exist in the https folder.');
    logger.error(error.message);
  }
}
bootstrap();
