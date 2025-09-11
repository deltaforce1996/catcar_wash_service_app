import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './auth.module';
import { LocalStrategy } from './passport-srategies/local.strategy';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './passport-srategies/jwt.strategy';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get('jwt.secret') || 'default';
        const expiresIn = configService.get('jwt.expiresIn') || '7d';
        return {
          secret,
          signOptions: { expiresIn },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  providers: [JwtStrategy, LocalStrategy, JwtAuthGuard, LocalAuthGuard],
  exports: [JwtModule],
})
export class JwtGlobalModule {}
