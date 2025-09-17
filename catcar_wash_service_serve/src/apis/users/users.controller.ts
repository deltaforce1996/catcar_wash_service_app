import { Body, Controller, Get, Param, Post, Put, Query, UseFilters, UseGuards, Request } from '@nestjs/common';
import { UserWithDeviceCountsRow, UserWithoutDeviceCountsRow, UsersService } from './users.service';
import { AllExceptionFilter } from 'src/common';
import { SearchUserDto } from './dtos/search-user.dto';
import { RegisterUserDto } from './dtos/register-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginatedResult } from 'src/types/internal.type';
import { UpdateUserDto } from './dtos/update-user.dto';
import { SuccessResponse } from 'src/types';
import { RoleAdminAndTechnician, RoleAdmin } from '../auth/decorators/roles.decorator';
import { RoleAuthGuard } from '../auth/guards/role-auth.guard';
import { UserSelfUpdateGuard } from '../auth/guards/user-self-update.guard';
import { SelfUpdate } from '../auth/decorators/self-update.decorator';
import { AuthenticatedUser } from 'src/types/internal.type';

type UserPublicResponse = PaginatedResult<UserWithDeviceCountsRow | UserWithoutDeviceCountsRow>;

@UseFilters(AllExceptionFilter)
@UseGuards(JwtAuthGuard, RoleAuthGuard, UserSelfUpdateGuard)
@Controller('api/v1/users')
@RoleAdminAndTechnician()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  async searchUsers(@Query() q: SearchUserDto): Promise<SuccessResponse<UserPublicResponse>> {
    const result = await this.usersService.searchUsers(q);
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

  @Put('update-profile')
  @SelfUpdate()
  async updateUserProfile(
    @Request() req: Request & { user: AuthenticatedUser },
    @Body() data: UpdateUserDto,
  ): Promise<SuccessResponse<UserWithDeviceCountsRow>> {
    const userId = req.user.id;
    const result = await this.usersService.updateById(userId, data);
    return {
      success: true,
      data: result,
      message: 'User profile updated successfully',
    };
  }

  @Put('update-by-id/:id')
  @RoleAdmin()
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
