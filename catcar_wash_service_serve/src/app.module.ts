import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import { DeviceStateProcessorModule } from './modules/device-state-processor';
import { MqttModule } from './modules/mqtt';
import { DashboardModule } from './apis/dashboard/dashboard.module';
import { PaymentGatewayModule } from './apis/payment-gateway/payment-gateway.module';
import { DeviceCommandsModule } from './apis/device-commands/device-commands.module';
import { MqttConsoleModule } from './apis/mqtt-console';
import { DateTimeService } from './services';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, beamCheckoutConfig],
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    JwtGlobalModule,
    AuthModule,
    EmpsModule,
    UsersModule,
    DevicesModule,
    DeviceEventLogsModule,
    DeviceStatesModule,
    DeviceStateProcessorModule,
    MqttModule,
    DashboardModule,
    PaymentGatewayModule,
    DeviceCommandsModule,
    MqttConsoleModule,
  ],
  controllers: [AppController],
  providers: [AppService, DateTimeService],
})
export class AppModule {}
