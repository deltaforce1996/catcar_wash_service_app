import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma/prisma.module';
import { appConfig, jwtConfig, beamCheckoutConfig } from './configs';
import { AuthModule } from './apis/auth';
import { JwtGlobalModule } from './apis/auth/jwt-global.module';
import { EmpsModule } from './apis/emps/emps.module';
import { UsersModule } from './apis/users/users.module';
import { DevicesModule } from './apis/devices/devices.module';
import { DeviceEventLogsModule } from './apis/device-event-logs/device-event-logs.module';
import { DeviceStatesModule } from './apis/device-states/device-states.module';
import { DashboardModule } from './apis/dashboard/dashboard.module';
import { PaymentGatewayModule } from './apis/payment-gateway/payment-gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, beamCheckoutConfig],
    }),
    PrismaModule,
    JwtGlobalModule,
    AuthModule,
    EmpsModule,
    UsersModule,
    DevicesModule,
    DeviceEventLogsModule,
    DeviceStatesModule,
    DashboardModule,
    PaymentGatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
