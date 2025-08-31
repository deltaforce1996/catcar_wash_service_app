import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ErrorLoggerService } from 'src/services';

@Module({
  providers: [UsersService, ErrorLoggerService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
