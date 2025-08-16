import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma/prisma.module';
import { appConfig, jwtConfig } from './configs';
import { AuthModule } from './apis/auth';
import { JwtGlobalModule } from './apis/auth/jwt-global.module';
import { EmpsModule } from './apis/emps/emps.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig],
    }),
    PrismaModule,
    JwtGlobalModule,
    AuthModule,
    EmpsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
