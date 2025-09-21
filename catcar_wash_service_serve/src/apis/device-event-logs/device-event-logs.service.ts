import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from 'src/errors';
import { EventType, PaymentApiStatus, PermissionType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { parseKeyValueOnly } from 'src/shared/kv-parser';
import { AuthenticatedUser, PaginatedResult } from 'src/types/internal.type';
import { SearchDeviceEventLogsDto } from './dtos/search-devcie-event.dto';

export const deviceEventLogsPublicSelect = Prisma.validator<Prisma.tbl_devices_eventsSelect>()({
  id: true,
  device_id: true,
  payload: true,
  created_at: true,
  device: {
    select: {
      id: true,
      name: true,
      type: true,
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
type DeviceEventLogRowBase = Prisma.tbl_devices_eventsGetPayload<{ select: typeof deviceEventLogsPublicSelect }>;

// Extended type with formatted created_at and modified payload
// export type DeviceEventLogRow = DeviceEventLogRowBase & {
//   payload: (DeviceEventLogRowBase['payload'] & { event_at: string }) | null;
// };

export type DeviceEventLogRow = DeviceEventLogRowBase;

@Injectable()
export class DeviceEventLogsService {
  private readonly logger = new Logger(DeviceEventLogsService.name);
  private readonly allowed = [
    'id',
    'device_id',
    'device_name',
    'type',
    'payload_timestamp',
    'user_id',
    'payment_status',
    'search',
  ] as const;

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('DeviceEventLogsService initialized');
  }

  async searchDeviceEventLogs(
    q: SearchDeviceEventLogsDto,
    user?: AuthenticatedUser,
  ): Promise<PaginatedResult<DeviceEventLogRow>> {
    const pairs = parseKeyValueOnly(q.query ?? '', this.allowed);

    const ands: Prisma.tbl_devices_eventsWhereInput['AND'] = [];

    if (user?.permission?.name === PermissionType.USER) {
      ands.push({ device: { owner_id: user.id } });
    }

    // Handle general search - search device_id and device_name fields
    const search = pairs.find((p) => p.key === 'search')?.value;
    if (search) {
      ands.push({
        OR: [
          { device_id: { contains: search, mode: 'insensitive' } },
          { device: { name: { contains: search, mode: 'insensitive' } } },
          { device: { owner: { fullname: { contains: search, mode: 'insensitive' } } } },
        ],
      });
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
        case 'payment_status':
          ands.push({ payload: { path: ['status'], equals: value as PaymentApiStatus } });
          break;
        case 'type': {
          const v = value.toUpperCase();
          if (v === EventType.PAYMENT || v === EventType.INFO) {
            ands.push({ payload: { path: ['type'], equals: v as EventType } });
          } else {
            this.logger.warn(`Invalid type: ${v}`);
            throw new BadRequestException(
              `Invalid type: ${v} is not a valid type ${EventType.PAYMENT} or ${EventType.INFO}`,
            );
          }
          break;
        }
        case 'payload_timestamp': {
          // Parse timestamp value (expecting format: start-end or single timestamp)
          const timestampParts = value.split('-');

          if (timestampParts.length === 2) {
            // Range format: start-end
            const startTimestamp = parseInt(timestampParts[0], 10);
            const endTimestamp = parseInt(timestampParts[1], 10);

            if (!isNaN(startTimestamp) && !isNaN(endTimestamp)) {
              ands.push({
                payload: {
                  path: ['timestamp'],
                  not: Prisma.DbNull,
                },
              });

              ands.push({
                payload: {
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
                payload: {
                  path: ['timestamp'],
                  not: Prisma.DbNull,
                },
              });

              ands.push({
                payload: {
                  path: ['timestamp'],
                  equals: timestamp,
                },
              });
            }
          }
          break;
        }
        case 'user_id': {
          ands.push({
            payload: {
              path: ['user_id'],
              string_contains: value,
            },
          });
          break;
        }
      }
    }

    const where: Prisma.tbl_devices_eventsWhereInput | undefined = ands.length ? { AND: ands } : undefined;

    const safePage = Math.max(1, Number(q.page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const [data, total] = await Promise.all([
      this.prisma.tbl_devices_events.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: {
          [q.sort_by ?? 'created_at']: q.sort_order ?? 'desc',
        },
        select: deviceEventLogsPublicSelect,
      }),
      this.prisma.tbl_devices_events.count({ where }),
    ]);

    // Transform the data to format created_at as YYYY-MM-DD hh:mm:ss and add event_at to payload
    // const transformedData = data.map((item) => {
    //   const basePayload = item.payload as Record<string, any> | null;
    //   const transformedPayload = basePayload
    //     ? {
    //         ...basePayload,
    //         event_at: basePayload.timestamp ? new Date(Number(basePayload.timestamp)) : basePayload.timestamp,
    //       }
    //     : basePayload;

    //   return {
    //     ...item,
    //     payload: transformedPayload,
    //   };
    // });

    return {
      items: data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }
}
