import { Body, Controller, Get, Param, Put, Query, UseFilters, UseGuards } from '@nestjs/common';
import { UserWithDeviceCountsRow, UsersService } from './users.service';
import { AllExceptionFilter } from 'src/common';
import { SearchUserDto } from './dtos/search-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginatedResult } from 'src/types/internal.type';
import { UpdateUserDto } from './dtos/update-user.dto';
import { SuccessResponse } from 'src/types';
import { RoleAdminAndTechnician } from '../auth/decorators/roles.decorator';
import { RoleAuthGuard } from '../auth/guards/role-auth.guard';

type UserPublicResponse = PaginatedResult<UserWithDeviceCountsRow>;

@UseFilters(AllExceptionFilter)
@UseGuards(JwtAuthGuard, RoleAuthGuard)
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
}
