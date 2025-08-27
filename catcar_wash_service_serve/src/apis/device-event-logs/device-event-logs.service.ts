import { Injectable, Logger } from '@nestjs/common';
import { EventType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { parseKeyValueOnly } from 'src/shared/kv-parser';
import { PaginatedResult } from 'src/types/internal.type';
import { SearchDeviceEventLogsDto } from './dtos/search-devcie-event.dto';

export const deviceEventLogsPublicSelect = Prisma.validator<Prisma.tbl_devices_eventsSelect>()({
  id: true,
  device_id: true,
  payload: true,
  type: true,
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

export type DeviceEventLogRow = Prisma.tbl_devices_eventsGetPayload<{ select: typeof deviceEventLogsPublicSelect }>;

@Injectable()
export class DeviceEventLogsService {
  private readonly logger = new Logger(DeviceEventLogsService.name);
  private readonly allowed = [
    'id',
    'device_id',
    'type',
    'payload_timestemp',
    'time_range',
    'payment_type',
    'user_id',
    'has_qr',
    'has_bank',
    'has_coin',
    'type_log',
  ] as const;

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('DeviceEventLogsService initialized');
  }

  async searchDeviceEventLogs(q: SearchDeviceEventLogsDto): Promise<PaginatedResult<DeviceEventLogRow>> {
    const pairs = parseKeyValueOnly(q.query ?? '', this.allowed);

    const ands: Prisma.tbl_devices_eventsWhereInput['AND'] = [];

    for (const { key, value } of pairs) {
      switch (key) {
        case 'id':
        case 'device_id':
          ands.push({ [key]: { contains: value, mode: 'insensitive' } });
          break;
        case 'type': {
          const v = value.toUpperCase();
          if (v === EventType.PAYMENT || v === EventType.INFO) {
            ands.push({ type: v as EventType });
          }
          break;
        }
        case 'time_range': {
          // Handle time range filtering like "12:00-15:00"
          const timeRangeMatch = value.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
          if (timeRangeMatch) {
            // For now, just filter for events that have timestamp in payload
            // Future enhancement: implement exact time range filtering with raw SQL
            ands.push({
              payload: {
                path: ['timestemp'],
                not: Prisma.DbNull,
              },
            });

            // Log for future enhancement with raw SQL
            this.logger.warn(
              `Time range filtering (${value}) implemented with basic payload check. Consider raw SQL for exact time matching.`,
            );
          }
          break;
        }
        case 'payload_timestemp': {
          // Handle timestamp filtering within JSON payload (Unix timestamp in milliseconds)
          const timestamp = new Date(value);
          if (!isNaN(timestamp.getTime())) {
            // Search within a range by checking if the timestamp exists in that range
            // Note: This is a basic approach - for exact timestamp matching, consider using raw queries
            ands.push({
              payload: {
                path: ['timestemp'],
                not: Prisma.DbNull,
              },
            });

            // Add a more specific date-based filter using the table's created_at as a fallback
            ands.push({
              created_at: {
                gte: new Date(timestamp.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
                lte: new Date(timestamp.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after
              },
            });
          }
          break;
        }
        case 'payment_type': {
          // Search for payment_type within JSON payload
          ands.push({
            payload: {
              path: ['payment_type'],
              string_contains: value,
            },
          });
          break;
        }
        case 'user_id': {
          // Search for user_id within JSON payload
          ands.push({
            payload: {
              path: ['user_id'],
              string_contains: value,
            },
          });
          break;
        }
        case 'has_qr': {
          // Check if payment has QR payment method (net_amount != 0)
          const hasQr = value.toLowerCase() === 'true' || value === '1';
          if (hasQr) {
            ands.push({
              AND: [
                {
                  payload: {
                    path: ['qr', 'net_amount'],
                    not: Prisma.DbNull,
                  },
                },
                {
                  payload: {
                    path: ['qr', 'net_amount'],
                    gt: 0,
                  },
                },
              ],
            });
          } else {
            ands.push({
              OR: [
                {
                  payload: {
                    path: ['qr', 'net_amount'],
                    equals: Prisma.DbNull,
                  },
                },
                {
                  payload: {
                    path: ['qr', 'net_amount'],
                    equals: 0,
                  },
                },
              ],
            });
          }
          break;
        }
        case 'has_bank': {
          // Check if payment has bank payment method (amount != 0)
          const hasBank = value.toLowerCase() === 'true' || value === '1';
          if (hasBank) {
            ands.push({
              AND: [
                {
                  payload: {
                    path: ['bank'],
                    not: Prisma.DbNull,
                  },
                },
                {
                  payload: {
                    path: ['bank'],
                    gt: 0,
                  },
                },
              ],
            });
          } else {
            ands.push({
              OR: [
                {
                  payload: {
                    path: ['bank'],
                    equals: Prisma.DbNull,
                  },
                },
                {
                  payload: {
                    path: ['bank'],
                    equals: 0,
                  },
                },
              ],
            });
          }
          break;
        }
        case 'has_coin': {
          // Check if payment has coin payment method (amount != 0)
          const hasCoin = value.toLowerCase() === 'true' || value === '1';
          if (hasCoin) {
            ands.push({
              AND: [
                {
                  payload: {
                    path: ['coin'],
                    not: Prisma.DbNull,
                  },
                },
                {
                  payload: {
                    path: ['coin'],
                    gt: 0,
                  },
                },
              ],
            });
          } else {
            ands.push({
              OR: [
                {
                  payload: {
                    path: ['coin'],
                    equals: Prisma.DbNull,
                  },
                },
                {
                  payload: {
                    path: ['coin'],
                    equals: 0,
                  },
                },
              ],
            });
          }
          break;
        }
        case 'type_log': {
          // Search for type_log within JSON payload
          ands.push({
            payload: {
              path: ['type_log'],
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

    return {
      items: data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }
}
