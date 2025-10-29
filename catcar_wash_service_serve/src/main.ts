import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTimeTransformInterceptor } from './common';
import { DateTimeService } from './services';
import { join } from 'path';

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

  logger.log(`Server is running on port ${port} in ${configService.get<string>('app.environment')} mode`);
  await app.listen(port ?? 3000);
}
bootstrap();
