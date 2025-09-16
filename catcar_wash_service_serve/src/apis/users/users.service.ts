import { Injectable, Logger } from '@nestjs/common';
import { UserStatus, PermissionType, Prisma, DeviceStatus } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ItemNotFoundException } from 'src/errors';
import { BcryptService } from 'src/services/bcrypt.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { RegisterUserDto } from './dtos/register-user.dto';
import { parseKeyValueOnly } from 'src/shared/kv-parser';
import { PaginatedResult } from 'src/types/internal.type';
import { SearchUserDto } from './dtos/search-user.dto';

export const userPublicSelect = Prisma.validator<Prisma.tbl_usersSelect>()({
  id: true,
  fullname: true,
  email: true,
  phone: true,
  address: true,
  custom_name: true,
  status: true,
  created_at: true,
  updated_at: true,
  permission: {
    select: {
      id: true,
      name: true,
    },
  },
  // _count: { select: { devices: true } },
});

type UserRow = Prisma.tbl_usersGetPayload<{ select: typeof userPublicSelect }>;

export type UserWithDeviceCountsRow = UserRow & {
  // created_at?: string;
  // updated_at?: string;
  device_counts: { total: number; active: number; inactive: number };
};

const ALLOWED = [
  'id',
  'email',
  'fullname',
  'phone',
  'address',
  'custom_name',
  'status',
  'permission',
  'search',
] as const;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcryptService: BcryptService,
  ) {
    this.logger.log('UsersService initialized');
  }

  async searchUsers(q: SearchUserDto): Promise<PaginatedResult<UserWithDeviceCountsRow>> {
    const pairs = parseKeyValueOnly(q.query ?? '', ALLOWED);

    const ands: Prisma.tbl_usersWhereInput['AND'] = [];

    // Handle general search - search id, fullname, email, phone, and address fields
    const search = pairs.find((p) => p.key === 'search')?.value;
    if (search) {
      ands.push({
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { fullname: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    for (const { key, value } of pairs) {
      switch (key) {
        case 'id':
        case 'email':
        case 'fullname':
        case 'phone':
        case 'address':
        case 'custom_name':
          ands.push({ [key]: { contains: value, mode: 'insensitive' } });
          break;
        case 'status': {
          const v = value.toUpperCase();
          if (v === 'ACTIVE' || v === 'INACTIVE') ands.push({ status: v as UserStatus });
          break;
        }
        case 'permission': {
          ands.push({ permission: { name: value.toUpperCase() as PermissionType } });
          break;
        }
      }
    }

    const where = ands.length ? { AND: ands } : undefined;

    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.tbl_users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: userPublicSelect,
      }),
      this.prisma.tbl_users.count({ where }),
    ]);

    if (users.length === 0) {
      return { items: [], total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
    }

    const userIds = users.map((u) => u.id);
    const grouped = await this.prisma.tbl_devices.groupBy({
      by: ['owner_id', 'status'],
      where: { owner_id: { in: userIds } },
      _count: { _all: true },
    });

    const counters = new Map<string, { active: number; inactive: number }>();
    for (const row of grouped) {
      const cur = counters.get(row.owner_id) ?? { active: 0, inactive: 0 };
      if (row.status === DeviceStatus.DEPLOYED) cur.active = row._count._all;
      else if (row.status === DeviceStatus.DISABLED) cur.inactive = row._count._all;
      counters.set(row.owner_id, cur);
    }

    const items: UserWithDeviceCountsRow[] = users.map((u) => ({
      ...u,
      device_counts: {
        total: (counters.get(u.id)?.active ?? 0) + (counters.get(u.id)?.inactive ?? 0),
        active: counters.get(u.id)?.active ?? 0,
        inactive: counters.get(u.id)?.inactive ?? 0,
      },
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findById(id: string): Promise<UserWithDeviceCountsRow> {
    const user = await this.prisma.tbl_users.findUnique({
      where: { id },
      select: userPublicSelect,
    });
    if (!user) throw new ItemNotFoundException('User not found');

    const byStatus = await this.prisma.tbl_devices.groupBy({
      by: ['status', 'owner_id'],
      where: { owner_id: id },
      _count: { _all: true },
    });

    const counts = { active: 0, inactive: 0 };
    for (const row of byStatus) {
      if (row.status === DeviceStatus.DEPLOYED) counts.active = row._count._all;
      else if (row.status === DeviceStatus.DISABLED) counts.inactive = row._count._all;
    }

    return {
      ...user,
      device_counts: { total: counts.active + counts.inactive, ...counts },
    };
  }

  async updateById(id: string, data: UpdateUserDto): Promise<UserWithDeviceCountsRow> {
    // Check if user exists first
    const existingUser = await this.prisma.tbl_users.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new ItemNotFoundException('User not found');
    }

    const user = await this.prisma.tbl_users.update({
      where: { id },
      data,
      select: userPublicSelect,
    });

    const byStatus = await this.prisma.tbl_devices.groupBy({
      by: ['status', 'owner_id'],
      where: { owner_id: id },
      _count: { _all: true },
    });

    const counts = { active: 0, inactive: 0 };
    for (const row of byStatus) {
      if (row.status === DeviceStatus.DEPLOYED) counts.active = row._count._all;
      else if (row.status === DeviceStatus.DISABLED) counts.inactive = row._count._all;
    }

    return {
      ...user,
      device_counts: { total: counts.active + counts.inactive, ...counts },
    };
  }

  async registerUser(data: RegisterUserDto): Promise<UserWithDeviceCountsRow> {
    // Default password for new users
    const defaultPassword = 'CatCarWash123!';
    const hashedPassword = await this.bcryptService.hashPassword(defaultPassword);

    // Get USER permission
    const permission = await this.prisma.tbl_permissions.findUnique({
      where: { name: PermissionType.USER },
    });

    if (!permission) {
      throw new ItemNotFoundException('USER permission not found');
    }

    // Create new user
    const user = await this.prisma.tbl_users.create({
      data: {
        fullname: data.fullname,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        address: data.address,
        custom_name: data.custom_name,
        permission_id: permission.id,
        status: UserStatus.ACTIVE,
      },
      select: userPublicSelect,
    });

    // Get device counts for the new user (will be 0 for new users)
    const byStatus = await this.prisma.tbl_devices.groupBy({
      by: ['status', 'owner_id'],
      where: { owner_id: user.id },
      _count: { _all: true },
    });

    const counts = { active: 0, inactive: 0 };
    for (const row of byStatus) {
      if (row.status === DeviceStatus.DEPLOYED) counts.active = row._count._all;
      else if (row.status === DeviceStatus.DISABLED) counts.inactive = row._count._all;
    }

    return {
      ...user,
      device_counts: { total: counts.active + counts.inactive, ...counts },
    };
  }
}
