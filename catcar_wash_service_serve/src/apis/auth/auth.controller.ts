import { Controller, Post, Request, UseFilters, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from 'src/types/internal.type';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AllExceptionFilter } from 'src/common';
import type { SuccessResponse } from 'src/types';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserAuth } from './decorators';
import { UsersService, UserWithDeviceCountsRow } from '../users/users.service';
import { EmpsService, EmpRow } from '../emps/emps.service';
import { PermissionType } from '@prisma/client';

@UseFilters(AllExceptionFilter)
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly empsService: EmpsService,
  ) {}

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
  async me(@UserAuth() user: AuthenticatedUser): Promise<SuccessResponse<UserWithDeviceCountsRow | EmpRow>> {
    // ตรวจสอบ permission และดึงข้อมูลตาม role
    if (user.permission.name === PermissionType.USER) {
      const userData = await this.usersService.findById(user.id);
      return {
        success: true,
        data: userData,
        message: 'User information retrieved successfully',
      };
    } else if (user.permission.name === PermissionType.TECHNICIAN || user.permission.name === PermissionType.ADMIN) {
      const empData = await this.empsService.findById(user.id);
      return {
        success: true,
        data: empData,
        message: 'Employee information retrieved successfully',
      };
    } else {
      // Fallback สำหรับกรณีที่ไม่รู้จัก permission
      return {
        success: true,
        data: user as any,
        message: 'User information retrieved successfully',
      };
    }
  }
}
