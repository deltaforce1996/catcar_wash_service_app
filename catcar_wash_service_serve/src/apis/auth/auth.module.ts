import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BcryptService } from 'src/services/bcrypt.service';
import { AuthController } from './auth.controller';
import { ErrorLoggerService } from 'src/services';

@Module({
  providers: [AuthService, BcryptService, ErrorLoggerService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
