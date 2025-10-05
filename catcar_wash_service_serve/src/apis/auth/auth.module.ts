import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BcryptService } from 'src/services/bcrypt.service';
import { AuthController } from './auth.controller';
import { ErrorLoggerService } from 'src/services';
import { UsersModule } from '../users/users.module';
import { EmpsModule } from '../emps/emps.module';

@Module({
  imports: [UsersModule, EmpsModule],
  providers: [AuthService, BcryptService, ErrorLoggerService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
