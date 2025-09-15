/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DateTimeService } from '../../services/datetime.service';

@Injectable()
export class DateTimeTransformInterceptor implements NestInterceptor {
  constructor(private readonly dateTimeService: DateTimeService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.transformResponse(data)));
  }

  private transformResponse(data: any): any {
    if (!data) return data;

    // ถ้าเป็น array
    if (Array.isArray(data)) {
      return data.map((item) => this.transformResponse(item));
    }

    // ถ้าเป็น object
    if (typeof data === 'object' && data !== null) {
      const transformed = { ...data };

      // แปลง datetime fields
      const dateFields = ['created_at', 'updated_at', 'expire_date', 'deleted_at', 'event_at', 'timestamp'];
      dateFields.forEach((field) => {
        if (transformed[field]) {
          // Handle timestamp field specially since it might be a number (Unix timestamp)
          if (field === 'timestamp' && typeof transformed[field] === 'number') {
            const timestamp = transformed[field];
            const dateObj = timestamp > 1e10 ? new Date(timestamp) : new Date(timestamp * 1000);
            transformed[field] = this.dateTimeService.convertToThailandTime(dateObj);
          } else {
            transformed[field] = this.dateTimeService.convertToThailandTime(transformed[field] as Date | string);
          }
        }
      });

      // แปลง nested objects และ arrays
      Object.keys(transformed).forEach((key) => {
        if (typeof transformed[key] === 'object' && transformed[key] !== null) {
          transformed[key] = this.transformResponse(transformed[key]);
        }
      });

      return transformed;
    }

    return data;
  }
}
