import { Injectable, Logger } from '@nestjs/common';
import { EmpStatus, PermissionType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ItemNotFoundException } from 'src/errors';
import { UpdateEmpDto } from './dtos/update-emp.dto';
import { parseKeyValueOnly } from 'src/shared/kv-parser';
import { PaginatedResult } from 'src/types/internal.type';
import { SearchEmpDto } from './dtos/search-emp.dto';
import { formatDateTime } from 'src/shared/date-formatter';

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

type EmpRowBase = Prisma.tbl_empsGetPayload<{ select: typeof empPublicSelect }>;

export type EmpRow = Omit<EmpRowBase, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

const ALLOWED = ['id', 'email', 'name', 'phone', 'line', 'address', 'status', 'permission', 'search'] as const;

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
    const search = pairs.find((p) => p.key === 'search')?.value;
    if (search) {
      ands.push({
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { line: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
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

    const formattedData: EmpRow[] = data.map((emp) => ({
      ...emp,
      created_at: emp.created_at ? formatDateTime(emp.created_at) : undefined,
      updated_at: emp.updated_at ? formatDateTime(emp.updated_at) : undefined,
    }));

    return {
      items: formattedData,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async findById(id: string): Promise<EmpRow> {
    const emp: EmpRowBase | null = await this.prisma.tbl_emps.findUnique({
      where: { id },
      select: empPublicSelect,
    });
    if (!emp) {
      throw new ItemNotFoundException('Employee not found');
    }

    return {
      ...emp,
      created_at: emp.created_at ? formatDateTime(emp.created_at) : undefined,
      updated_at: emp.updated_at ? formatDateTime(emp.updated_at) : undefined,
    };
  }

  async updateById(id: string, data: UpdateEmpDto): Promise<EmpRow> {
    const emp: EmpRowBase = await this.prisma.tbl_emps.update({
      where: { id },
      data,
      select: empPublicSelect,
    });
    if (!emp) {
      throw new ItemNotFoundException('Employee not found');
    }

    return {
      ...emp,
      created_at: emp.created_at ? formatDateTime(emp.created_at) : undefined,
      updated_at: emp.updated_at ? formatDateTime(emp.updated_at) : undefined,
    };
  }
}
