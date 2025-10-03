import { Module } from '@nestjs/common';
import { EmpsService } from './emps.service';
import { EmpsController } from './emps.controller';
import { ErrorLoggerService } from 'src/services';
import { BcryptService } from 'src/services/bcrypt.service';

@Module({
  providers: [EmpsService, ErrorLoggerService, BcryptService],
  controllers: [EmpsController],
  exports: [EmpsService],
})
export class EmpsModule {}
