import { Injectable, Logger } from '@nestjs/common';
import { EmpStatus, PermissionType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ItemNotFoundException } from 'src/errors';
import { UpdateEmpDto } from './dtos/update-emp.dto';
import { parseKeyValueOnly } from 'src/shared/kv-parser';
import { PaginatedResult } from 'src/types/internal.type';
import { SearchEmpDto } from './dtos/search-emp.dto';

export const empPublicSelect = Prisma.validator<Prisma.tbl_empsSelect>()({
  id: true,
  name: true,
  email: true,
  phone: true,
  line: true,
  address: true,
  status: true,
  created_at: true,
  updated_at: true,
  permission: {
    select: {
      id: true,
      name: true,
    },
  },
});

export type EmpRow = Prisma.tbl_empsGetPayload<{ select: typeof empPublicSelect }>;

const ALLOWED = ['id', 'email', 'name', 'phone', 'line', 'address', 'status', 'permission'] as const;

@Injectable()
export class EmpsService {
  private readonly logger = new Logger(EmpsService.name);
  constructor(private readonly prisma: PrismaService) {
    this.logger.log('EmpsService initialized');
  }

  async searchEmps(q: SearchEmpDto): Promise<PaginatedResult<EmpRow>> {
    const pairs = parseKeyValueOnly(q.query ?? '', ALLOWED);

    const ands: Prisma.tbl_empsWhereInput['AND'] = [];

    // Handle general search - search id, name, email, line, and address fields
    if (q.search) {
      ands.push({
        OR: [
          { id: { contains: q.search, mode: 'insensitive' } },
          { name: { contains: q.search, mode: 'insensitive' } },
          { email: { contains: q.search, mode: 'insensitive' } },
          { line: { contains: q.search, mode: 'insensitive' } },
          { address: { contains: q.search, mode: 'insensitive' } },
        ],
      });
    }

    for (const { key, value } of pairs) {
      switch (key) {
        case 'id':
          ands.push({ id: value });
          break;
        case 'email':
        case 'name':
        case 'phone':
        case 'line':
        case 'address':
          ands.push({ [key]: { contains: value, mode: 'insensitive' } });
          break;
        case 'status': {
          const v = value.toUpperCase();
          if (v === 'ACTIVE' || v === 'INACTIVE') {
            ands.push({ status: v as EmpStatus });
          }
          break;
        }
        case 'permission': {
          const v = value.toUpperCase() as PermissionType;
          const key_name: string = `permission.name`;
          ands.push({ [key_name]: { contains: v, mode: 'insensitive' } });
          break;
        }
      }
    }

    const where: Prisma.tbl_empsWhereInput | undefined = ands.length ? { AND: ands } : undefined;

    const safePage = Math.max(1, Number(q.page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const [data, total] = await Promise.all([
      this.prisma.tbl_emps.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { created_at: 'desc' },
        select: empPublicSelect,
      }),
      this.prisma.tbl_emps.count({ where }),
    ]);

    return {
      items: data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async findById(id: string): Promise<EmpRow> {
    const emp: EmpRow | null = await this.prisma.tbl_emps.findUnique({
      where: { id },
      select: empPublicSelect,
    });
    if (!emp) {
      throw new ItemNotFoundException('Employee not found');
    }
    return emp;
  }

  async updateById(id: string, data: UpdateEmpDto): Promise<EmpRow> {
    const emp: EmpRow = await this.prisma.tbl_emps.update({
      where: { id },
      data,
      select: empPublicSelect,
    });
    if (!emp) {
      throw new ItemNotFoundException('Employee not found');
    }
    return emp;
  }
}
