import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser, JwtPayload } from 'src/types/internal.type';
import { ConfigService } from '@nestjs/config';
import { InvalidTokenException } from 'src/errors';
import { AuthService } from '../auth.service';
import { PermissionType } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret') || 'default',
    });

    this.logger.log('JWT Strategy initialized');
    this.logger.debug(`JWT_SECRET: ${this.configService.get('jwt.secret')}`);
    this.logger.debug(`JWT_EXPIRES_IN: ${this.configService.get('jwt.expiresIn')}`);
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser | undefined> {
    if (!payload || !payload.id) {
      throw new InvalidTokenException('Invalid token payload: missing user ID');
    }

    this.logger.debug(`JWT Payload: ${JSON.stringify(payload)}`);

    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new InvalidTokenException('Token has expired');
    }

    try {
      if (payload.permission.name === PermissionType.USER) {
        const user: AuthenticatedUser | undefined = await this.authService.validateUserById(payload.id);
        if (!user) throw new InvalidTokenException('Token references non-existent user');
        return user;
      }

      if (payload.permission.name === PermissionType.TECHNICIAN || payload.permission.name === PermissionType.ADMIN) {
        const employee: AuthenticatedUser | undefined = await this.authService.validateEmployeeById(payload.id);
        if (!employee) throw new InvalidTokenException('Token references non-existent employee');
        return employee;
      }
    } catch (error: any) {
      this.logger.error(`JWT Validation Error: ${error.stack}`);
      if (error.name === 'ItemNotFoundException') {
        throw new InvalidTokenException('Token references non-existent user');
      }
      if (error instanceof UnauthorizedException || error instanceof InvalidTokenException) {
        throw error;
      }
    }
  }
}
