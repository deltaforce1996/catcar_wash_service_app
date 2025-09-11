import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PermissionType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { parseKeyValueOnly } from 'src/shared/kv-parser';
import { formatDateTime } from 'src/shared/date-formatter';
import { PaginatedResult, DeviceState, AuthenticatedUser } from 'src/types/internal.type';
import { SearchDeviceStatesDto } from './dtos/search-device-states.dto';

export const deviceStatesPublicSelect = Prisma.validator<Prisma.tbl_devices_stateSelect>()({
  id: true,
  device_id: true,
  state_data: true,
  hash_state: true,
  created_at: true,
  device: {
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      owner: {
        select: {
          id: true,
          fullname: true,
          email: true,
        },
      },
    },
  },
});

// Base type from Prisma
type DeviceStateRowBase = Prisma.tbl_devices_stateGetPayload<{ select: typeof deviceStatesPublicSelect }>;

// Extended type with formatted created_at and parsed state_data (with date_state)
export type DeviceStateRow = Omit<DeviceStateRowBase, 'created_at' | 'state_data'> & {
  created_at: string;
  state_data: DeviceState | null;
};

@Injectable()
export class DeviceStatesService {
  private readonly logger = new Logger(DeviceStatesService.name);
  private readonly allowed = ['id', 'device_id', 'device_name', 'status', 'payload_timestemp'] as const;

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('DeviceStatesService initialized');
  }

  async searchDeviceStates(
    q: SearchDeviceStatesDto,
    user?: AuthenticatedUser,
  ): Promise<PaginatedResult<DeviceStateRow>> {
    const pairs = parseKeyValueOnly(q.query ?? '', this.allowed);

    const ands: Prisma.tbl_devices_stateWhereInput['AND'] = [];

    // Add permission-based filtering for USER role
    if (user?.permission?.name === PermissionType.USER) {
      ands.push({ device: { owner_id: user.id } });
    }

    for (const { key, value } of pairs) {
      switch (key) {
        case 'id':
        case 'device_id':
          ands.push({ [key]: { contains: value, mode: 'insensitive' } });
          break;
        case 'device_name':
          ands.push({
            device: {
              name: { contains: value, mode: 'insensitive' },
            },
          });
          break;
        case 'status': {
          const v = value.toLowerCase();
          if (v === 'normal' || v === 'error') {
            ands.push({
              state_data: {
                path: ['status'],
                equals: v,
              },
            });
          } else {
            this.logger.warn(`Invalid status: ${v}`);
            throw new BadRequestException(`Invalid status: ${v} is not a valid status. Must be 'normal' or 'error'`);
          }
          break;
        }
        case 'payload_timestemp': {
          // Parse timestamp value (expecting format: start-end or single timestamp)
          const timestampParts = value.split('-');

          if (timestampParts.length === 2) {
            // Range format: start-end
            const startTimestamp = parseInt(timestampParts[0], 10);
            const endTimestamp = parseInt(timestampParts[1], 10);

            if (!isNaN(startTimestamp) && !isNaN(endTimestamp)) {
              ands.push({
                state_data: {
                  path: ['timestamp'],
                  not: Prisma.DbNull,
                },
              });

              ands.push({
                state_data: {
                  path: ['timestamp'],
                  gte: startTimestamp,
                  lte: endTimestamp,
                },
              });
            }
          } else {
            // Single timestamp
            const timestamp = parseInt(value, 10);
            if (!isNaN(timestamp)) {
              ands.push({
                state_data: {
                  path: ['timestamp'],
                  not: Prisma.DbNull,
                },
              });

              ands.push({
                state_data: {
                  path: ['timestamp'],
                  equals: timestamp,
                },
              });
            }
          }
          break;
        }
      }
    }

    const where: Prisma.tbl_devices_stateWhereInput | undefined = ands.length ? { AND: ands } : undefined;

    const safePage = Math.max(1, Number(q.page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const [data, total] = await Promise.all([
      this.prisma.tbl_devices_state.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: {
          [q.sort_by ?? 'created_at']: q.sort_order ?? 'desc',
        },
        select: deviceStatesPublicSelect,
      }),
      this.prisma.tbl_devices_state.count({ where }),
    ]);

    // Transform the data to format created_at and parse state_data with state_at
    const transformedData = data.map((item) => ({
      ...item,
      created_at: formatDateTime(item.created_at),
      state_data: item.state_data
        ? {
            ...(item.state_data as DeviceState),
            state_at: formatDateTime(item.created_at),
          }
        : null,
    }));

    return {
      items: transformedData,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }
}
