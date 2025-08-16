import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from 'src/types/error-response.type';
import { ErrorLoggerService } from 'src/services/error-logger.service';

@Catch(HttpException, Error)
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);
  constructor(private readonly errorLogger: ErrorLoggerService) {
    this.logger.log('AllExceptionFilter initialized');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let responseBody: ErrorResponse;

    // ✅ กรณี HttpException (เช่น 400, 403, 404)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exRes = exception.getResponse();

      this.logger.warn(`[HttpException] ${exception.message} ${exception.getStatus()}`);

      if (typeof exRes === 'string') {
        responseBody = {
          success: false,
          errorCode: 'HTTP_EXCEPTION',
          message: exRes,
        };
      } else {
        const err = exRes as Record<string, any>;

        const message = Array.isArray(err.message) ? err.message.join('; ') : err.message || 'An error occurred';

        responseBody = {
          success: false,
          errorCode: err.errorCode || 'HTTP_EXCEPTION',
          message,
        };
      }
    } else {
      // ✅ กรณี Error (ไม่ใช่ HttpException) เช่น bug หรือ throw new Error()
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      const err = exception as Error;

      this.logger.error(err.stack);

      this.errorLogger.logErrorToFile(err, request);

      responseBody = {
        success: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      };
    }

    // ✅ ป้องกันตอบซ้ำ
    if (!response.headersSent) {
      response.status(status).json({
        ...responseBody,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
