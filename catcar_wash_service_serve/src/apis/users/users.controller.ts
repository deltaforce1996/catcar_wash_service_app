import { Body, Controller, Get, Param, Post, Put, Query, UseFilters, UseGuards } from '@nestjs/common';
import { UserWithDeviceCountsRow, UserWithoutDeviceCountsRow, UsersService } from './users.service';
import { AllExceptionFilter } from 'src/common';
import { SearchUserDto } from './dtos/search-user.dto';
import { RegisterUserDto } from './dtos/register-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from 'src/types/internal.type';
import { PaginatedResult } from 'src/types/internal.type';
import { UpdateUserDto, UpdateUserProfileDto } from './dtos/update-user.dto';
import { SuccessResponse } from 'src/types';
import { RoleAdminAndTechnician, RoleAdmin, SelfUpdate, UserAuth } from '../auth/decorators';
import { RoleAuthGuard } from '../auth/guards/role-auth.guard';
import { UserSelfUpdateGuard } from '../auth/guards/user-self-update.guard';

type UserPublicResponse = PaginatedResult<UserWithDeviceCountsRow | UserWithoutDeviceCountsRow>;

@UseFilters(AllExceptionFilter)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  async searchUsers(
    @Query() q: SearchUserDto,
    @UserAuth() user: AuthenticatedUser,
  ): Promise<SuccessResponse<UserPublicResponse>> {
    const result = await this.usersService.searchUsers(q, user.id, user.permission.name);
    return {
      success: true,
      data: result,
      message: 'Users searched successfully',
    };
  }

  @Get('find-by-id/:id')
  async getUserById(@Param('id') id: string): Promise<SuccessResponse<UserWithDeviceCountsRow>> {
    const result = await this.usersService.findById(id);
    return {
      success: true,
      data: result,
      message: 'User found successfully',
    };
  }

  @UseGuards(UserSelfUpdateGuard)
  @SelfUpdate()
  @Put('update-profile')
  async updateUserProfile(
    @UserAuth('id') userId: string,
    @Body() data: UpdateUserProfileDto,
  ): Promise<SuccessResponse<UserWithDeviceCountsRow>> {
    const result = await this.usersService.updateById(userId, data);
    return {
      success: true,
      data: result,
      message: 'User profile updated successfully',
    };
  }

  @UseGuards(RoleAuthGuard)
  @RoleAdmin()
  @Put('update-by-id/:id')
  async updateUserById(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
  ): Promise<SuccessResponse<UserWithDeviceCountsRow>> {
    const result = await this.usersService.updateById(id, data);
    return {
      success: true,
      data: result,
      message: 'User updated successfully',
    };
  }

  @UseGuards(RoleAuthGuard)
  @RoleAdminAndTechnician()
  @Post('register')
  async registerUser(@Body() data: RegisterUserDto): Promise<SuccessResponse<UserWithDeviceCountsRow>> {
    const result = await this.usersService.registerUser(data);
    return {
      success: true,
      data: result,
      message: 'User registered successfully',
    };
  }
}
