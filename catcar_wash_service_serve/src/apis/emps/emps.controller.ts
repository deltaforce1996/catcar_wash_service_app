import { Body, Controller, Get, Param, Put, Query, UseFilters, UseGuards } from '@nestjs/common';
import { EmpsService } from './emps.service';
import { AllExceptionFilter } from 'src/common';
import { SearchEmpDto } from './dtos/search-emp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginatedResult } from 'src/types/internal.type';
import { tbl_emps } from '@prisma/client';
import { UpdateEmpDto } from './dtos/update-emp.dto';
import { SuccessResponse } from 'src/types';

type EmpPublic = Partial<tbl_emps & { permission: { id: string; name: string } }>;
type EmpPublicResponse = PaginatedResult<EmpPublic>;

@UseFilters(AllExceptionFilter)
@UseGuards(JwtAuthGuard)
@Controller('api/v1/emps')
export class EmpsController {
  constructor(private readonly empsService: EmpsService) {}

  @Get('search')
  async searchEmps(@Query() q: SearchEmpDto): Promise<SuccessResponse<EmpPublicResponse>> {
    const result = await this.empsService.searchEmps(q);
    return {
      success: true,
      data: result,
      message: 'Emps searched successfully',
    };
  }

  @Get('find-by-id/:id')
  async getEmpById(@Param('id') id: string): Promise<SuccessResponse<EmpPublic>> {
    const result = await this.empsService.findById(id);
    return {
      success: true,
      data: result,
      message: 'Emp found successfully',
    };
  }

  @Put('update-by-id/:id')
  async updateEmpById(@Param('id') id: string, @Body() data: UpdateEmpDto): Promise<SuccessResponse<EmpPublic>> {
    const result = await this.empsService.updateById(id, data);
    return {
      success: true,
      data: result,
      message: 'Emp updated successfully',
    };
  }
}
