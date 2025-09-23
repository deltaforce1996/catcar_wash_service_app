import { Body, Controller, Get, Param, Post, Put, Query, UseFilters, UseGuards } from '@nestjs/common';
import { EmpRow, EmpsService } from './emps.service';
import { AllExceptionFilter } from 'src/common';
import { CreateEmpDto } from './dtos/create-emp.dto';
import { SearchEmpDto } from './dtos/search-emp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginatedResult } from 'src/types/internal.type';
import { UpdateEmpDto } from './dtos/update-emp.dto';
import { SuccessResponse } from 'src/types';
import { RoleAuthGuard } from '../auth/guards/role-auth.guard';
import { RoleAdmin, RoleAdminAndTechnician, SelfUpdate, UserAuth } from '../auth/decorators';
import { EmpSelfUpdateGuard } from '../auth/guards/emp-self-update.guard';

type EmpPublicResponse = PaginatedResult<EmpRow>;

@UseFilters(AllExceptionFilter)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/emps')
export class EmpsController {
  constructor(private readonly empsService: EmpsService) {}

  @UseGuards(RoleAuthGuard)
  @RoleAdmin()
  @Post('register')
  async registerEmp(@Body() data: CreateEmpDto): Promise<SuccessResponse<EmpRow>> {
    const result = await this.empsService.register(data);
    return {
      success: true,
      data: result,
      message: 'Technician registered successfully',
    };
  }

  @UseGuards(RoleAuthGuard)
  @RoleAdminAndTechnician()
  @Get('search')
  async searchEmps(@Query() q: SearchEmpDto): Promise<SuccessResponse<EmpPublicResponse>> {
    const result = await this.empsService.searchEmps(q);
    return {
      success: true,
      data: result,
      message: 'Emps searched successfully',
    };
  }

  @UseGuards(RoleAuthGuard)
  @RoleAdminAndTechnician()
  @Get('find-by-id/:id')
  async getEmpById(@Param('id') id: string): Promise<SuccessResponse<EmpRow>> {
    const result = await this.empsService.findById(id);
    return {
      success: true,
      data: result,
      message: 'Emp found successfully',
    };
  }

  @UseGuards(EmpSelfUpdateGuard)
  @SelfUpdate()
  @Put('update-profile')
  async updateEmpProfile(@UserAuth('id') empId: string, @Body() data: UpdateEmpDto): Promise<SuccessResponse<EmpRow>> {
    const result = await this.empsService.updateById(empId, data);
    return {
      success: true,
      data: result,
      message: 'Emp profile updated successfully',
    };
  }

  @UseGuards(RoleAuthGuard)
  @RoleAdmin()
  @Put('update-by-id/:id')
  async updateEmpById(@Param('id') id: string, @Body() data: UpdateEmpDto): Promise<SuccessResponse<EmpRow>> {
    const result = await this.empsService.updateById(id, data);
    return {
      success: true,
      data: result,
      message: 'Emp updated successfully',
    };
  }
}
