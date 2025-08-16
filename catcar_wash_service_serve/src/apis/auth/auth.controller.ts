import { Controller, Post, Request, UseFilters, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from 'src/types/internal.type';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AllExceptionFilter } from 'src/common';
import type { SuccessResponse } from 'src/types';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@UseFilters(AllExceptionFilter)
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: Request & { user: AuthenticatedUser }): SuccessResponse<{ token: string }> {
    const user = req.user;
    return {
      success: true,
      data: { token: this.authService.issueToken(user) },
      message: 'Login successful',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  me(@Request() req: Request & { user: AuthenticatedUser }): SuccessResponse<AuthenticatedUser> {
    return {
      success: true,
      data: req.user,
      message: 'User information retrieved successfully',
    };
  }
}
