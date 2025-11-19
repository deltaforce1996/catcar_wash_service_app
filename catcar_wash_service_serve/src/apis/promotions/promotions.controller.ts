import { Body, Controller, Get, Param, Post, Put, Query, UseFilters, UseGuards } from '@nestjs/common';
import { PromotionRow, PromotionsService } from './promotions.service';
import { AllExceptionFilter } from 'src/common';
import { CreatePromotionDto } from './dtos/create-promotion.dto';
import { UpdatePromotionDto } from './dtos/update-promotion.dto';
import { SearchPromotionDto } from './dtos/search-promotion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleAuthGuard } from '../auth/guards/role-auth.guard';
import { RoleAdmin } from '../auth/decorators';
import { PaginatedResult } from 'src/types/internal.type';
import { SuccessResponse } from 'src/types';

type PromotionPublicResponse = PaginatedResult<PromotionRow>;

@UseFilters(AllExceptionFilter)
@UseGuards(JwtAuthGuard, RoleAuthGuard)
@RoleAdmin()
@Controller('api/v1/promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('search')
  async searchPromotions(@Query() q: SearchPromotionDto): Promise<SuccessResponse<PromotionPublicResponse>> {
    const result = await this.promotionsService.searchPromotions(q);
    return {
      success: true,
      data: result,
      message: 'Promotions searched successfully',
    };
  }

  @Get('find-by-id/:id')
  async getPromotionById(@Param('id') id: string): Promise<SuccessResponse<PromotionRow>> {
    const result = await this.promotionsService.findById(id);
    return {
      success: true,
      data: result,
      message: 'Promotion found successfully',
    };
  }

  @Post('create')
  async createPromotion(@Body() data: CreatePromotionDto): Promise<SuccessResponse<PromotionRow>> {
    const result = await this.promotionsService.create(data);
    return {
      success: true,
      data: result,
      message: 'Promotion created successfully',
    };
  }

  @Put('update-by-id/:id')
  async updatePromotionById(
    @Param('id') id: string,
    @Body() data: UpdatePromotionDto,
  ): Promise<SuccessResponse<PromotionRow>> {
    const result = await this.promotionsService.updateById(id, data);
    return {
      success: true,
      data: result,
      message: 'Promotion updated successfully',
    };
  }
}
