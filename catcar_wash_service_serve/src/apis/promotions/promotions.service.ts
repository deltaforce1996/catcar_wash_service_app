import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ItemNotFoundException } from 'src/errors';
import { parseKeyValueOnly } from 'src/shared/kv-parser';
import { PaginatedResult } from 'src/types/internal.type';
import { CreatePromotionDto } from './dtos/create-promotion.dto';
import { UpdatePromotionDto } from './dtos/update-promotion.dto';
import { SearchPromotionDto } from './dtos/search-promotion.dto';

export const promotionPublicSelect = Prisma.validator<Prisma.tbl_promotionsSelect>()({
  id: true,
  name: true,
  description: true,
  discount_percent: true,
  start_date: true,
  end_date: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  assigned_users: {
    select: {
      id: true,
      user: {
        select: {
          id: true,
          fullname: true,
          email: true,
        },
      },
    },
  },
});

type PromotionRowBase = Prisma.tbl_promotionsGetPayload<{ select: typeof promotionPublicSelect }>;

export type PromotionRow = PromotionRowBase;

const ALLOWED = ['id', 'name', 'description', 'is_active', 'search'] as const;

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('PromotionsService initialized');
  }

  async searchPromotions(q: SearchPromotionDto): Promise<PaginatedResult<PromotionRow>> {
    const pairs = parseKeyValueOnly(q.query ?? '', ALLOWED);

    const ands: Prisma.tbl_promotionsWhereInput['AND'] = [];

    // Handle general search
    const search = pairs.find((p) => p.key === 'search')?.value;
    if (search) {
      ands.push({
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    for (const { key, value } of pairs) {
      switch (key) {
        case 'id':
          ands.push({ id: value });
          break;
        case 'name':
        case 'description':
          ands.push({ [key]: { contains: value, mode: 'insensitive' } });
          break;
        case 'is_active': {
          const v = value.toLowerCase();
          if (v === 'true' || v === 'false') {
            ands.push({ is_active: v === 'true' });
          }
          break;
        }
      }
    }

    const where: Prisma.tbl_promotionsWhereInput = ands.length > 0 ? { AND: ands } : {};

    const page = Number(q.page) || 1;
    const limit = Number(q.limit) || 20;
    const skip = (page - 1) * limit;

    const sort_by = q.sort_by || 'created_at';
    const sort_order = q.sort_order || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.tbl_promotions.findMany({
        where,
        select: promotionPublicSelect,
        skip,
        take: limit,
        orderBy: { [sort_by]: sort_order },
      }),
      this.prisma.tbl_promotions.count({ where }),
    ]);

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);

    return {
      items: data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async findById(id: string): Promise<PromotionRow> {
    const promotion = await this.prisma.tbl_promotions.findUnique({
      where: { id },
      select: promotionPublicSelect,
    });

    if (!promotion) {
      throw new ItemNotFoundException('Promotion not found');
    }

    return promotion;
  }

  async create(data: CreatePromotionDto): Promise<PromotionRow> {
    const { user_ids, ...promotionData } = data;

    // Validate dates
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate user_ids if provided (only USER role)
    if (user_ids && user_ids.length > 0) {
      const users = await this.prisma.tbl_users.findMany({
        where: {
          id: { in: user_ids },
        },
        include: {
          permission: true,
        },
      });

      // Check if all users exist
      if (users.length !== user_ids.length) {
        throw new BadRequestException('Some user IDs are invalid');
      }

      // Check if all users have USER role
      const nonUserRoles = users.filter((u) => u.permission?.name !== 'USER');
      if (nonUserRoles.length > 0) {
        throw new BadRequestException('Promotions can only be assigned to users with USER role');
      }
    }

    const promotion = await this.prisma.tbl_promotions.create({
      data: {
        ...promotionData,
        start_date: startDate,
        end_date: endDate,
        assigned_users: user_ids
          ? {
              create: user_ids.map((userId) => ({
                user_id: userId,
              })),
            }
          : undefined,
      },
      select: promotionPublicSelect,
    });

    return promotion;
  }

  async updateById(id: string, data: UpdatePromotionDto): Promise<PromotionRow> {
    const { user_ids, start_date, end_date, ...updateData } = data;

    // Check if promotion exists
    const existing = await this.prisma.tbl_promotions.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ItemNotFoundException('Promotion not found');
    }

    // Validate dates if provided
    if (start_date || end_date) {
      const startDateObj = start_date ? new Date(start_date) : existing.start_date;
      const endDateObj = end_date ? new Date(end_date) : existing.end_date;

      if (endDateObj <= startDateObj) {
        throw new BadRequestException('End date must be after start date');
      }

      updateData['start_date'] = startDateObj;
      updateData['end_date'] = endDateObj;
    }

    // Validate user_ids if provided
    if (user_ids !== undefined) {
      if (user_ids.length > 0) {
        const users = await this.prisma.tbl_users.findMany({
          where: {
            id: { in: user_ids },
          },
          include: {
            permission: true,
          },
        });

        if (users.length !== user_ids.length) {
          throw new BadRequestException('Some user IDs are invalid');
        }

        const nonUserRoles = users.filter((u) => u.permission?.name !== 'USER');
        if (nonUserRoles.length > 0) {
          throw new BadRequestException('Promotions can only be assigned to users with USER role');
        }
      }

      // Update assigned users
      await this.prisma.tbl_promotion_users.deleteMany({
        where: { promotion_id: id },
      });

      if (user_ids.length > 0) {
        await this.prisma.tbl_promotion_users.createMany({
          data: user_ids.map((userId) => ({
            promotion_id: id,
            user_id: userId,
          })),
        });
      }
    }

    const promotion = await this.prisma.tbl_promotions.update({
      where: { id },
      data: updateData,
      select: promotionPublicSelect,
    });

    return promotion;
  }
}
