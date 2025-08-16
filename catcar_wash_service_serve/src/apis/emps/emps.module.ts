import { Module } from '@nestjs/common';
import { EmpsService } from './emps.service';
import { EmpsController } from './emps.controller';
import { ErrorLoggerService } from 'src/services';

@Module({
  providers: [EmpsService, ErrorLoggerService],
  controllers: [EmpsController],
  exports: [EmpsService],
})
export class EmpsModule {}
