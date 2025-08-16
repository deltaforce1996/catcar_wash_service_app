import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorLoggerService } from 'src/services';
import { ErrorResponse } from 'src/types';

@Catch(Error)
export class LoggingFilter implements ExceptionFilter {
  constructor(private readonly errorLogger: ErrorLoggerService) {}

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    console.log('Generic Error:', exception.message, exception.stack);

    // Log to file using service
    this.errorLogger.logErrorToFile(exception, request);

    const responseBody: ErrorResponse = {
      success: false,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    };

    response.status(status).json({
      ...responseBody,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
