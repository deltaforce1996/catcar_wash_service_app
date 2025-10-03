// local.strategy.ts
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { AuthenticatedUser } from 'src/types/internal.type';
import { BadRequestException, UnauthorizedException } from 'src/errors';

export type LocalStrategyType = 'EMP' | 'USER';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      passReqToCallback: true,
      usernameField: 'email',
      passwordField: 'password',
    });
    this.logger.log('Local Strategy initialized');
  }

  async validate(req: Request, email: string, password: string): Promise<AuthenticatedUser> {
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }
    if (!this.isValidEmail(email)) {
      throw new UnauthorizedException('Invalid email format');
    }

    const role = (req.body?.role as LocalStrategyType) || 'USER';

    if (!['EMP', 'USER'].includes(role)) {
      throw new BadRequestException('Invalid role type provided, only EMP or USER are allowed');
    }

    try {
      if (role === 'EMP') {
        const employee: AuthenticatedUser | undefined = await this.authService.validateEmployeeByEmail(email, password);
        if (!employee) throw new UnauthorizedException('Invalid email or password');
        return employee;
      } else {
        const user: AuthenticatedUser | undefined = await this.authService.validateUserByEmail(email, password);
        if (!user) throw new UnauthorizedException('Invalid email or password');
        return user;
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
