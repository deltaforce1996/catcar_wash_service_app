import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, ItemNotFoundException, PermissionDeniedException } from 'src/errors';
import { DeviceType, EventType, PaymentApiStatus, PermissionType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { SqlScriptService } from 'src/services/sql-script.service';
import { parseKeyValueOnly } from 'src/shared/kv-parser';
import { AuthenticatedUser, PaginatedResult } from 'src/types/internal.type';
import { SearchDeviceEventLogsDto } from 'src/apis/device-event-logs/dtos/search-devcie-event.dto';
import { UploadLogsDto } from 'src/apis/device-event-logs/dtos/upload-logs.dto';
import { IDeviceEventLogsEventAdapter } from './device-event-logs-event.adapter';
import ExcelJS from 'exceljs';

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
  private adapter: IDeviceEventLogsEventAdapter | null = null;
  private readonly allowed = [
    'id',
    'device_id',
    'device_name',
    'device_type',
    'type',
    'payload_timestamp',
    'user_id',
    'payment_status',
    'search',
  ] as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sqlScriptService: SqlScriptService,
  ) {
    this.logger.log('DeviceEventLogsService initialized');
  }

  /**
   * Set the adapter for event emission (called by adapter to avoid circular dependency)
   */
  setAdapter(adapter: IDeviceEventLogsEventAdapter): void {
    this.adapter = adapter;
    this.logger.log('DeviceEventLogsEventAdapter has been set');
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
        case 'device_type':
          ands.push({ device: { type: { equals: value as DeviceType } } });
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
            device: {
              owner_id: { equals: value },
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

  async uploadDeviceEventLogs(uploadLogsDto: UploadLogsDto): Promise<{ created_count: number }> {
    this.logger.log(`Uploading device event logs for device: ${uploadLogsDto.device_id}`);

    // Verify that the device exists
    const device = await this.prisma.tbl_devices.findUnique({
      where: { id: uploadLogsDto.device_id },
      select: { id: true },
    });

    if (!device) {
      throw new BadRequestException('Device not found');
    }

    // Create device event logs for each item
    const createdEvents = await Promise.all(
      uploadLogsDto.items.map(async (item) => {
        const payload = {
          type: item.type,
          status: item.status,
          timestamp: item.timestamp,
          total_amount: item.total_amount,
          discount_percent: item.discount_percent,
          qr: item.qr,
          bank: item.bank,
          coin: item.coin,
        };

        // Convert timestamp to Date for created_at to match payload timestamp
        const eventDate = new Date(item.timestamp);

        return this.prisma.tbl_devices_events.create({
          data: {
            device_id: uploadLogsDto.device_id,
            payload: payload as any,
            created_at: eventDate, // Use event timestamp instead of NOW()
          },
        });
      }),
    );

    this.logger.log(
      `Successfully created ${createdEvents.length} device event logs for device: ${uploadLogsDto.device_id}`,
    );

    // Emit event through adapter for materialized view refresh
    const eventPayload = {
      device_id: uploadLogsDto.device_id,
      count: createdEvents.length,
      timestamp: new Date(),
    };

    this.adapter?.emitEventsUploaded(eventPayload);

    return {
      created_count: createdEvents.length,
    };
  }

  async exportMonthToExcel(selectedDate?: Date, user?: AuthenticatedUser): Promise<Buffer> {
    this.logger.log('Exporting device event logs for selected month to Excel');

    // Get the selected month's date range (first day 00:00:00 - last day 23:59:59) in local timezone
    const date = selectedDate || new Date();
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    const startTimestamp = startOfMonth.getTime();
    const endTimestamp = endOfMonth.getTime();

    // Build where clause
    const ands: Prisma.tbl_devices_eventsWhereInput['AND'] = [];

    // Filter by user if USER permission
    if (user?.permission?.name === PermissionType.USER) {
      ands.push({ device: { owner_id: user.id } });
    }

    // Add timestamp filter for the selected month
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

    const where: Prisma.tbl_devices_eventsWhereInput = { AND: ands };

    // Fetch all data for the selected month (no pagination)
    const data = await this.prisma.tbl_devices_events.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      select: deviceEventLogsPublicSelect,
    });

    // Calculate summary statistics
    const summary = this.calculateSummary(data);

    // Generate Excel file
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานประจำเดือน');

    // Set column widths (optimized for readability)
    worksheet.columns = [
      { width: 22 }, // วันที่-เวลา
      { width: 28 }, // ชื่ออุปกรณ์
      { width: 12 }, // ประเภท
      { width: 28 }, // เจ้าของ
      { width: 16 }, // สถานะ
      { width: 18 }, // จำนวนเงิน
      { width: 12 }, // ส่วนลด (%)
      { width: 30 }, // รหัสธุรกรรม
      { width: 16 }, // QR (฿)
      { width: 10 }, // ธ.20
      { width: 10 }, // ธ.50
      { width: 10 }, // ธ.100
      { width: 10 }, // ธ.500
      { width: 10 }, // ธ.1000
      { width: 16 }, // Bank (฿)
      { width: 10 }, // ฿1
      { width: 10 }, // ฿2
      { width: 10 }, // ฿5
      { width: 10 }, // ฿10
      { width: 16 }, // Coin (฿)
    ];

    // Add summary section (rows 1-14)
    this.addSummarySection(worksheet, summary, startOfMonth);

    // Add spacing row (row 18)
    const spacingRow = worksheet.getRow(18);
    spacingRow.height = 5;

    // Add data section headers (row 19)
    const headerRow = worksheet.getRow(19);
    const headers = [
      'วันที่-เวลา',
      'ชื่ออุปกรณ์',
      'ประเภท',
      'เจ้าของ',
      'สถานะ',
      'จำนวนเงิน (฿)',
      'ส่วนลด (%)',
      'รหัสธุรกรรม',
      'QR (฿)',
      'ธ.20',
      'ธ.50',
      'ธ.100',
      'ธ.500',
      'ธ.1000',
      'Bank (฿)',
      '฿1',
      '฿2',
      '฿5',
      '฿10',
      'Coin (฿)',
    ];
    const thinBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FF000000' } };
    const mediumBorder: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: 'FF000000' } };

    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' }, // Blue header
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: mediumBorder,
        left: index === 0 ? mediumBorder : thinBorder,
        bottom: mediumBorder,
        right: index === headers.length - 1 ? mediumBorder : thinBorder,
      };
    });
    headerRow.height = 25;

    // Add data rows (starting from row 20)
    const thinBorderData: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFD0D0D0' } };
    const mediumBorderData: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: 'FF000000' } };

    data.forEach((event, index) => {
      const rowNumber = 20 + index;
      const row = worksheet.getRow(rowNumber);

      const payload = event.payload as any;
      const timestamp = payload?.timestamp ? new Date(Number(payload.timestamp)) : null;
      const formattedDate = timestamp
        ? timestamp.toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-';

      const deviceName = event.device?.name || '-';
      const deviceType = event.device?.type === 'WASH' ? 'ล้างรถ' : event.device?.type === 'DRYING' ? 'เป่าลม' : '-';
      const ownerName = event.device?.owner?.fullname || '-';
      const status = this.translatePaymentStatus(payload?.status);
      const totalAmount = payload?.total_amount ? Number(payload.total_amount) : 0;
      const discountPercent = payload?.discount_percent ? Number(payload.discount_percent) : 0;
      const transactionId = payload?.qr?.transaction_id || '-';

      // Extract payment method amounts
      const qrAmount = payload?.qr?.net_amount ? Number(payload.qr.net_amount) : 0;
      const bankAmount = payload?.bank
        ? Object.entries(payload.bank).reduce((sum, [denom, count]) => sum + Number(denom) * Number(count), 0)
        : 0;
      const coinAmount = payload?.coin
        ? Object.entries(payload.coin).reduce((sum, [denom, count]) => sum + Number(denom) * Number(count), 0)
        : 0;

      // Extract denomination counts and format as "count(amount)"
      const bank20Count = payload?.bank?.['20'] ? Number(payload.bank['20']) : 0;
      const bank50Count = payload?.bank?.['50'] ? Number(payload.bank['50']) : 0;
      const bank100Count = payload?.bank?.['100'] ? Number(payload.bank['100']) : 0;
      const bank500Count = payload?.bank?.['500'] ? Number(payload.bank['500']) : 0;
      const bank1000Count = payload?.bank?.['1000'] ? Number(payload.bank['1000']) : 0;

      const coin1Count = payload?.coin?.['1'] ? Number(payload.coin['1']) : 0;
      const coin2Count = payload?.coin?.['2'] ? Number(payload.coin['2']) : 0;
      const coin5Count = payload?.coin?.['5'] ? Number(payload.coin['5']) : 0;
      const coin10Count = payload?.coin?.['10'] ? Number(payload.coin['10']) : 0;

      // Format as "count(amount)" - e.g., "5(500)" means 5 notes totaling 500 baht
      const bank20Display = bank20Count > 0 ? `${bank20Count}(${bank20Count * 20})` : '';
      const bank50Display = bank50Count > 0 ? `${bank50Count}(${bank50Count * 50})` : '';
      const bank100Display = bank100Count > 0 ? `${bank100Count}(${bank100Count * 100})` : '';
      const bank500Display = bank500Count > 0 ? `${bank500Count}(${bank500Count * 500})` : '';
      const bank1000Display = bank1000Count > 0 ? `${bank1000Count}(${bank1000Count * 1000})` : '';

      const coin1Display = coin1Count > 0 ? `${coin1Count}(${coin1Count * 1})` : '';
      const coin2Display = coin2Count > 0 ? `${coin2Count}(${coin2Count * 2})` : '';
      const coin5Display = coin5Count > 0 ? `${coin5Count}(${coin5Count * 5})` : '';
      const coin10Display = coin10Count > 0 ? `${coin10Count}(${coin10Count * 10})` : '';

      row.values = [
        formattedDate,
        deviceName,
        deviceType,
        ownerName,
        status,
        totalAmount,
        discountPercent > 0 ? `${discountPercent}%` : '-',
        transactionId,
        qrAmount,
        bank20Display,
        bank50Display,
        bank100Display,
        bank500Display,
        bank1000Display,
        bankAmount,
        coin1Display,
        coin2Display,
        coin5Display,
        coin10Display,
        coinAmount,
      ];

      // Determine status color
      let statusColor = { argb: 'FF000000' }; // Default black
      let statusBgColor = { argb: 'FFFFFFFF' }; // Default white
      const rawStatus = payload?.status;

      if (rawStatus === 'SUCCEEDED') {
        statusColor = { argb: 'FF2E7D32' }; // Green text
        statusBgColor = { argb: 'FFE8F5E9' }; // Light green background
      } else if (rawStatus === 'FAILED') {
        statusColor = { argb: 'FFC62828' }; // Red text
        statusBgColor = { argb: 'FFFFEBEE' }; // Light red background
      } else if (rawStatus === 'PENDING') {
        statusColor = { argb: 'FFF57C00' }; // Orange text
        statusBgColor = { argb: 'FFFFF3E0' }; // Light orange background
      } else if (rawStatus === 'CANCELLED') {
        statusColor = { argb: 'FF757575' }; // Gray text
        statusBgColor = { argb: 'FFF5F5F5' }; // Light gray background
      }

      // Apply styling to each cell
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        // Borders
        cell.border = {
          top: thinBorderData,
          left: colNumber === 1 ? mediumBorderData : thinBorderData,
          bottom: index === data.length - 1 ? mediumBorderData : thinBorderData,
          right: colNumber === 20 ? mediumBorderData : thinBorderData,
        };

        // Alignment based on column
        if (colNumber === 1) {
          // วันที่-เวลา - center
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (
          colNumber === 6 ||
          colNumber === 7 ||
          colNumber === 9 ||
          colNumber === 10 ||
          colNumber === 11 ||
          colNumber === 12 ||
          colNumber === 13 ||
          colNumber === 14 ||
          colNumber === 15 ||
          colNumber === 16 ||
          colNumber === 17 ||
          colNumber === 18 ||
          colNumber === 19 ||
          colNumber === 20
        ) {
          // จำนวนเงิน, ส่วนลด, QR, denomination counts, Bank, Coin - center for counts, right for amounts
          if (colNumber === 6 || colNumber === 9 || colNumber === 15 || colNumber === 20) {
            // Amount columns - right align
            cell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
          } else {
            // Count columns and discount - center align
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        } else if (colNumber === 3 || colNumber === 5) {
          // ประเภท, สถานะ - center
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          // ชื่ออุปกรณ์, เจ้าของ, รหัสธุรกรรม - left
          cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        }

        // Alternating row colors (subtle)
        if (index % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFAFAFA' },
          };
        }

        // Apply status-specific styling to status column
        if (colNumber === 5) {
          cell.font = { bold: true, color: statusColor };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: statusBgColor,
          };
        }

        // Apply discount styling (column 7) - orange/warning color when has discount
        if (colNumber === 7) {
          const cellValue = cell.value?.toString() || '';
          if (cellValue !== '-' && cellValue !== '') {
            cell.font = { bold: true, color: { argb: 'FFF57C00' } }; // Orange text
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFF3E0' }, // Light orange background
            };
          }
        }
      });

      // Format currency columns (amount columns only)
      row.getCell(6).numFmt = '฿#,##0.00';
      row.getCell(6).font = { bold: true };
      row.getCell(9).numFmt = '฿#,##0.00';
      row.getCell(9).font = { bold: true };
      row.getCell(15).numFmt = '฿#,##0.00';
      row.getCell(15).font = { bold: true };
      row.getCell(20).numFmt = '฿#,##0.00';
      row.getCell(20).font = { bold: true };

      // Denomination cells (10-14, 16-19) are now text format "count(amount)"
      // No numFmt needed as they are strings

      // Set row height
      row.height = 22;
    });

    // Freeze header row
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 19 }];

    // Auto-filter
    worksheet.autoFilter = {
      from: { row: 19, column: 1 },
      to: { row: 19, column: 20 },
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private calculateSummary(data: DeviceEventLogRow[]) {
    let totalRevenue = 0;
    const totalRevenueByStatus = {
      SUCCEEDED: 0,
      FAILED: 0,
      PENDING: 0,
      CANCELLED: 0,
    };
    const statusCount = {
      SUCCEEDED: 0,
      FAILED: 0,
      PENDING: 0,
      CANCELLED: 0,
    };
    const paymentMethodAmount = {
      qr: 0,
      bank: 0,
      coin: 0,
    };
    const deviceTypeCount = {
      WASH: 0,
      DRYING: 0,
    };
    const denominationBreakdown = {
      bank: {
        20: { count: 0, amount: 0 },
        50: { count: 0, amount: 0 },
        100: { count: 0, amount: 0 },
        500: { count: 0, amount: 0 },
        1000: { count: 0, amount: 0 },
      },
      coin: {
        1: { count: 0, amount: 0 },
        2: { count: 0, amount: 0 },
        5: { count: 0, amount: 0 },
        10: { count: 0, amount: 0 },
      },
    };

    data.forEach((event) => {
      const payload = event.payload as any;

      // Total revenue (only from SUCCEEDED payments)
      if (payload?.status === PaymentApiStatus.SUCCEEDED && payload?.total_amount) {
        totalRevenue += Number(payload.total_amount);
      }

      // Status count
      if (payload?.status) {
        statusCount[payload.status as PaymentApiStatus] = (statusCount[payload.status as PaymentApiStatus] || 0) + 1;
      }

      // Total revenue by status
      if (payload?.total_amount) {
        const amount = Number(payload.total_amount);
        if (payload.status === PaymentApiStatus.SUCCEEDED) {
          totalRevenueByStatus.SUCCEEDED += amount;
        } else if (payload.status === PaymentApiStatus.FAILED) {
          totalRevenueByStatus.FAILED += amount;
        } else if (payload.status === PaymentApiStatus.PENDING) {
          totalRevenueByStatus.PENDING += amount;
        } else if (payload.status === PaymentApiStatus.CANCELLED) {
          totalRevenueByStatus.CANCELLED += amount;
        }
      }

      // Payment method amount (SUCCEEDED only)
      if (payload?.status === PaymentApiStatus.SUCCEEDED && payload?.qr?.net_amount) {
        paymentMethodAmount.qr += Number(payload.qr.net_amount);
      }
      if (payload?.status === PaymentApiStatus.SUCCEEDED && payload?.bank) {
        const bankTotal = Object.entries(payload.bank).reduce((sum, [denom, count]) => {
          return sum + Number(denom) * Number(count);
        }, 0);
        paymentMethodAmount.bank += bankTotal;

        // Count denominations (SUCCEEDED only)
        Object.entries(payload.bank).forEach(([denom, count]) => {
          const denomNum = Number(denom) as 20 | 50 | 100 | 500 | 1000;
          const countNum = Number(count);
          if (denominationBreakdown.bank[denomNum]) {
            denominationBreakdown.bank[denomNum].count += countNum;
            denominationBreakdown.bank[denomNum].amount += denomNum * countNum;
          }
        });
      }
      if (payload?.status === PaymentApiStatus.SUCCEEDED && payload?.coin) {
        const coinTotal = Object.entries(payload.coin).reduce((sum, [denom, count]) => {
          return sum + Number(denom) * Number(count);
        }, 0);
        paymentMethodAmount.coin += coinTotal;

        // Count denominations (SUCCEEDED only)
        Object.entries(payload.coin).forEach(([denom, count]) => {
          const denomNum = Number(denom) as 1 | 2 | 5 | 10;
          const countNum = Number(count);
          if (denominationBreakdown.coin[denomNum]) {
            denominationBreakdown.coin[denomNum].count += countNum;
            denominationBreakdown.coin[denomNum].amount += denomNum * countNum;
          }
        });
      }

      // Device type count
      if (event.device?.type) {
        deviceTypeCount[event.device.type] = (deviceTypeCount[event.device.type] || 0) + 1;
      }
    });

    return {
      totalRevenue,
      totalRevenueByStatus,
      statusCount,
      paymentMethodAmount,
      deviceTypeCount,
      denominationBreakdown,
      totalEvents: data.length,
    };
  }

  private addSummarySection(worksheet: ExcelJS.Worksheet, summary: any, date: Date) {
    // Define common border style
    const thinBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FF000000' } };
    const mediumBorder: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: 'FF000000' } };

    // Title - Merge cells and style
    worksheet.mergeCells('A1:G1');
    const titleRow = worksheet.getRow(1);
    const titleCell = titleRow.getCell(1);
    titleCell.value = 'สรุปรายงานรายเดือน';
    titleCell.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF57F2A' }, // Cat Car Wash orange
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.border = {
      top: mediumBorder,
      left: mediumBorder,
      bottom: thinBorder,
      right: mediumBorder,
    };
    titleRow.height = 30;

    // Month and Year - Merge cells and style
    worksheet.mergeCells('A2:B2');
    const dateRow = worksheet.getRow(2);
    const dateLabelCell = dateRow.getCell(1);
    dateLabelCell.value = `เดือน: ${date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
    })}`;
    dateLabelCell.font = { bold: true, size: 12 };
    dateLabelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFEF7E0' }, // Light orange
    };
    dateLabelCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    dateLabelCell.border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: thinBorder };

    // Style remaining cells in row 2
    for (let col = 3; col <= 7; col++) {
      const cell = dateRow.getCell(col);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF7E0' } };
      cell.border = {
        top: thinBorder,
        left: thinBorder,
        bottom: thinBorder,
        right: col === 7 ? mediumBorder : thinBorder,
      };
    }
    dateRow.height = 22;

    // Total Events
    const row3 = worksheet.getRow(3);
    row3.getCell(1).value = 'จำนวน Event ทั้งหมด:';
    row3.getCell(1).font = { bold: true };
    row3.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    row3.getCell(1).border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: thinBorder };

    row3.getCell(2).value = summary.totalEvents;
    row3.getCell(2).font = { bold: true, size: 11 };
    row3.getCell(2).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row3.getCell(2).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    row3.getCell(2).numFmt = '#,##0';

    // Style remaining cells in row 3
    for (let col = 3; col <= 7; col++) {
      row3.getCell(col).border = {
        top: thinBorder,
        left: thinBorder,
        bottom: thinBorder,
        right: col === 7 ? mediumBorder : thinBorder,
      };
    }
    row3.height = 20;

    // Total Revenue - SUCCEEDED (Highlighted)
    const row4 = worksheet.getRow(4);
    row4.getCell(1).value = 'รวมยอดเงินที่สำเร็จ:';
    row4.getCell(1).font = { bold: true, color: { argb: 'FF2E7D32' } };
    row4.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    row4.getCell(1).border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: thinBorder };

    row4.getCell(2).value = summary.totalRevenueByStatus.SUCCEEDED;
    row4.getCell(2).font = { bold: true, size: 12, color: { argb: 'FF2E7D32' } };
    row4.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E9' }, // Light green
    };
    row4.getCell(2).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row4.getCell(2).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    row4.getCell(2).numFmt = '"฿"#,##0.00';

    // Style remaining cells in row 4
    for (let col = 3; col <= 7; col++) {
      row4.getCell(col).border = {
        top: thinBorder,
        left: thinBorder,
        bottom: thinBorder,
        right: col === 7 ? mediumBorder : thinBorder,
      };
    }
    row4.height = 22;

    // Total Revenue - FAILED
    const row5 = worksheet.getRow(5);
    row5.getCell(1).value = 'รวมยอดเงินที่ล้มเหลว:';
    row5.getCell(1).font = { bold: true, color: { argb: 'FFC62828' } };
    row5.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    row5.getCell(1).border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: thinBorder };

    row5.getCell(2).value = summary.totalRevenueByStatus.FAILED;
    row5.getCell(2).font = { bold: true, size: 11, color: { argb: 'FFC62828' } };
    row5.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFEBEE' }, // Light red
    };
    row5.getCell(2).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row5.getCell(2).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    row5.getCell(2).numFmt = '"฿"#,##0.00';

    // Style remaining cells in row 5
    for (let col = 3; col <= 7; col++) {
      row5.getCell(col).border = {
        top: thinBorder,
        left: thinBorder,
        bottom: thinBorder,
        right: col === 7 ? mediumBorder : thinBorder,
      };
    }
    row5.height = 20;

    // Total Revenue - PENDING
    const row6 = worksheet.getRow(6);
    row6.getCell(1).value = 'รวมยอดเงินที่รอดำเนินการ:';
    row6.getCell(1).font = { bold: true, color: { argb: 'FFF57C00' } };
    row6.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    row6.getCell(1).border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: thinBorder };

    row6.getCell(2).value = summary.totalRevenueByStatus.PENDING;
    row6.getCell(2).font = { bold: true, size: 11, color: { argb: 'FFF57C00' } };
    row6.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF3E0' }, // Light orange
    };
    row6.getCell(2).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row6.getCell(2).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    row6.getCell(2).numFmt = '"฿"#,##0.00';

    // Style remaining cells in row 6
    for (let col = 3; col <= 7; col++) {
      row6.getCell(col).border = {
        top: thinBorder,
        left: thinBorder,
        bottom: thinBorder,
        right: col === 7 ? mediumBorder : thinBorder,
      };
    }
    row6.height = 20;

    // Total Revenue - CANCELLED
    const row7 = worksheet.getRow(7);
    row7.getCell(1).value = 'รวมยอดเงินที่ยกเลิก:';
    row7.getCell(1).font = { bold: true, color: { argb: 'FF757575' } };
    row7.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    row7.getCell(1).border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: thinBorder };

    row7.getCell(2).value = summary.totalRevenueByStatus.CANCELLED;
    row7.getCell(2).font = { bold: true, size: 11, color: { argb: 'FF757575' } };
    row7.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' }, // Light gray
    };
    row7.getCell(2).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row7.getCell(2).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    row7.getCell(2).numFmt = '"฿"#,##0.00';

    // Style remaining cells in row 7
    for (let col = 3; col <= 7; col++) {
      row7.getCell(col).border = {
        top: thinBorder,
        left: thinBorder,
        bottom: thinBorder,
        right: col === 7 ? mediumBorder : thinBorder,
      };
    }
    row7.height = 20;

    // Status breakdown header
    worksheet.mergeCells('A8:G8');
    const row8 = worksheet.getRow(8);
    const statusHeaderCell = row8.getCell(1);
    statusHeaderCell.value = 'จำนวน Event แยกตามสถานะ';
    statusHeaderCell.font = { bold: true, size: 11 };
    statusHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE3F2FD' }, // Light blue
    };
    statusHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    statusHeaderCell.border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: mediumBorder };
    row8.height = 20;

    // Status breakdown - Row 1
    const row9 = worksheet.getRow(9);
    row9.getCell(1).value = 'สำเร็จ:';
    row9.getCell(1).font = { color: { argb: 'FF2E7D32' } };
    row9.getCell(1).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row9.getCell(1).border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: thinBorder };

    row9.getCell(2).value = summary.statusCount.SUCCEEDED;
    row9.getCell(2).font = { bold: true };
    row9.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row9.getCell(2).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    row9.getCell(2).numFmt = '#,##0';

    row9.getCell(3).value = 'ล้มเหลว:';
    row9.getCell(3).font = { color: { argb: 'FFC62828' } };
    row9.getCell(3).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row9.getCell(3).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    row9.getCell(4).value = summary.statusCount.FAILED;
    row9.getCell(4).font = { bold: true };
    row9.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    row9.getCell(4).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    row9.getCell(4).numFmt = '#,##0';

    // Style remaining cells in row 9
    for (let col = 5; col <= 7; col++) {
      row9.getCell(col).border = {
        top: thinBorder,
        left: thinBorder,
        bottom: thinBorder,
        right: col === 7 ? mediumBorder : thinBorder,
      };
    }
    row9.height = 20;

    // Status breakdown - Row 2
    const row10 = worksheet.getRow(10);
    row10.getCell(1).value = 'รอดำเนินการ:';
    row10.getCell(1).font = { color: { argb: 'FFF57C00' } };
    row10.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    row10.getCell(1).border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: thinBorder };

    row10.getCell(2).value = summary.statusCount.PENDING;
    row10.getCell(2).font = { bold: true };
    row10.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row10.getCell(2).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    row10.getCell(2).numFmt = '#,##0';

    row10.getCell(3).value = 'ยกเลิก:';
    row10.getCell(3).font = { color: { argb: 'FF757575' } };
    row10.getCell(3).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row10.getCell(3).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    row10.getCell(4).value = summary.statusCount.CANCELLED;
    row10.getCell(4).font = { bold: true };
    row10.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    row10.getCell(4).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    row10.getCell(4).numFmt = '#,##0';

    // Style remaining cells in row 10
    for (let col = 5; col <= 7; col++) {
      row10.getCell(col).border = {
        top: thinBorder,
        left: thinBorder,
        bottom: thinBorder,
        right: col === 7 ? mediumBorder : thinBorder,
      };
    }
    row10.height = 20;

    // Payment method header
    worksheet.mergeCells('A11:G11');
    const row11 = worksheet.getRow(11);
    const paymentHeaderCell = row11.getCell(1);
    paymentHeaderCell.value = 'ยอดเงินแยกตามช่องทางชำระเงิน (สำเร็จเท่านั้น)';
    paymentHeaderCell.font = { bold: true, size: 11 };
    paymentHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3E5F5' }, // Light purple
    };
    paymentHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    paymentHeaderCell.border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: mediumBorder };
    row11.height = 20;

    // Payment method breakdown
    const row12 = worksheet.getRow(12);
    row12.getCell(1).value = 'QR Payment:';
    row12.getCell(1).font = { bold: false };
    row12.getCell(1).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row12.getCell(1).border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: thinBorder };

    row12.getCell(2).value = summary.paymentMethodAmount.qr;
    row12.getCell(2).font = { bold: true };
    row12.getCell(2).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row12.getCell(2).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    row12.getCell(2).numFmt = '"฿"#,##0.00';

    row12.getCell(3).value = 'ธนบัตร:';
    row12.getCell(3).font = { bold: false };
    row12.getCell(3).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row12.getCell(3).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    row12.getCell(4).value = summary.paymentMethodAmount.bank;
    row12.getCell(4).font = { bold: true };
    row12.getCell(4).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row12.getCell(4).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    row12.getCell(4).numFmt = '"฿"#,##0.00';

    row12.getCell(5).value = 'เหรียญ:';
    row12.getCell(5).font = { bold: false };
    row12.getCell(5).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row12.getCell(5).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    row12.getCell(6).value = summary.paymentMethodAmount.coin;
    row12.getCell(6).font = { bold: true };
    row12.getCell(6).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row12.getCell(6).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    row12.getCell(6).numFmt = '"฿"#,##0.00';

    row12.getCell(7).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: mediumBorder };
    row12.height = 20;

    // Device type header & data
    worksheet.mergeCells('A13:B13');
    const row13 = worksheet.getRow(13);
    const deviceHeaderCell = row13.getCell(1);
    deviceHeaderCell.value = 'จำนวนแยกตามประเภทอุปกรณ์';
    deviceHeaderCell.font = { bold: true, size: 11 };
    deviceHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFE0B2' }, // Light deep orange
    };
    deviceHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    deviceHeaderCell.border = { top: thinBorder, left: mediumBorder, bottom: mediumBorder, right: thinBorder };

    worksheet.mergeCells('C13:D13');
    row13.getCell(3).value = `เครื่องล้างรถ: ${summary.deviceTypeCount.WASH || 0} เครื่อง`;
    row13.getCell(3).font = { bold: true };
    row13.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    row13.getCell(3).border = { top: thinBorder, left: thinBorder, bottom: mediumBorder, right: thinBorder };

    worksheet.mergeCells('E13:G13');
    row13.getCell(5).value = `เครื่องอบหมวก: ${summary.deviceTypeCount.DRYING || 0} เครื่อง`;
    row13.getCell(5).font = { bold: true };
    row13.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
    row13.getCell(5).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: mediumBorder };
    row13.height = 20;

    // Denomination breakdown header (row 14)
    worksheet.mergeCells('A14:G14');
    const row14 = worksheet.getRow(14);
    const denomHeaderCell = row14.getCell(1);
    denomHeaderCell.value = 'รายละเอียดธนบัตรและเหรียญ (สำเร็จเท่านั้น)';
    denomHeaderCell.font = { bold: true, size: 11 };
    denomHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF9C4' }, // Light yellow
    };
    denomHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    denomHeaderCell.border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: mediumBorder };
    row14.height = 20;

    // Bank denomination details - Row 1 (row 15)
    const row15 = worksheet.getRow(15);
    const denom = summary.denominationBreakdown;

    row15.getCell(1).value = 'ธ.20:';
    row15.getCell(1).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row15.getCell(1).border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: thinBorder };

    row15.getCell(2).value = denom.bank[20].count > 0 ? `${denom.bank[20].count}(${denom.bank[20].amount})` : '-';
    row15.getCell(2).font = { bold: true };
    row15.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row15.getCell(2).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    row15.getCell(3).value = 'ธ.50:';
    row15.getCell(3).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row15.getCell(3).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    row15.getCell(4).value = denom.bank[50].count > 0 ? `${denom.bank[50].count}(${denom.bank[50].amount})` : '-';
    row15.getCell(4).font = { bold: true };
    row15.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    row15.getCell(4).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    row15.getCell(5).value = 'ธ.100:';
    row15.getCell(5).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row15.getCell(5).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    row15.getCell(6).value = denom.bank[100].count > 0 ? `${denom.bank[100].count}(${denom.bank[100].amount})` : '-';
    row15.getCell(6).font = { bold: true };
    row15.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
    row15.getCell(6).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    row15.getCell(7).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: mediumBorder };
    row15.height = 20;

    // Bank denomination details - Row 2 (row 16)
    const row16 = worksheet.getRow(16);

    row16.getCell(1).value = 'ธ.500:';
    row16.getCell(1).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row16.getCell(1).border = { top: thinBorder, left: mediumBorder, bottom: thinBorder, right: thinBorder };

    row16.getCell(2).value = denom.bank[500].count > 0 ? `${denom.bank[500].count}(${denom.bank[500].amount})` : '-';
    row16.getCell(2).font = { bold: true };
    row16.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row16.getCell(2).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    row16.getCell(3).value = 'ธ.1000:';
    row16.getCell(3).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row16.getCell(3).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    row16.getCell(4).value = denom.bank[1000].count > 0 ? `${denom.bank[1000].count}(${denom.bank[1000].amount})` : '-';
    row16.getCell(4).font = { bold: true };
    row16.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    row16.getCell(4).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    for (let col = 5; col <= 7; col++) {
      row16.getCell(col).border = {
        top: thinBorder,
        left: thinBorder,
        bottom: thinBorder,
        right: col === 7 ? mediumBorder : thinBorder,
      };
    }
    row16.height = 20;

    // Coin denomination details (row 17)
    const row17 = worksheet.getRow(17);

    row17.getCell(1).value = '฿1:';
    row17.getCell(1).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row17.getCell(1).border = { top: thinBorder, left: mediumBorder, bottom: mediumBorder, right: thinBorder };

    row17.getCell(2).value = denom.coin[1].count > 0 ? `${denom.coin[1].count}(${denom.coin[1].amount})` : '-';
    row17.getCell(2).font = { bold: true };
    row17.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row17.getCell(2).border = { top: thinBorder, left: thinBorder, bottom: mediumBorder, right: thinBorder };

    row17.getCell(3).value = '฿2:';
    row17.getCell(3).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row17.getCell(3).border = { top: thinBorder, left: thinBorder, bottom: mediumBorder, right: thinBorder };

    row17.getCell(4).value = denom.coin[2].count > 0 ? `${denom.coin[2].count}(${denom.coin[2].amount})` : '-';
    row17.getCell(4).font = { bold: true };
    row17.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    row17.getCell(4).border = { top: thinBorder, left: thinBorder, bottom: mediumBorder, right: thinBorder };

    row17.getCell(5).value = '฿5:';
    row17.getCell(5).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row17.getCell(5).border = { top: thinBorder, left: thinBorder, bottom: mediumBorder, right: thinBorder };

    row17.getCell(6).value = denom.coin[5].count > 0 ? `${denom.coin[5].count}(${denom.coin[5].amount})` : '-';
    row17.getCell(6).font = { bold: true };
    row17.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
    row17.getCell(6).border = { top: thinBorder, left: thinBorder, bottom: mediumBorder, right: thinBorder };

    row17.getCell(7).value = '฿10:';
    row17.getCell(7).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row17.getCell(7).border = { top: thinBorder, left: thinBorder, bottom: mediumBorder, right: thinBorder };

    // Add column 8 for ฿10 value
    const row17Col8 = worksheet.getRow(17).getCell(8);
    row17Col8.value = denom.coin[10].count > 0 ? `${denom.coin[10].count}(${denom.coin[10].amount})` : '-';
    row17Col8.font = { bold: true };
    row17Col8.alignment = { vertical: 'middle', horizontal: 'center' };
    row17Col8.border = { top: thinBorder, left: thinBorder, bottom: mediumBorder, right: mediumBorder };
    row17.height = 20;
  }

  private translatePaymentStatus(status: string | undefined): string {
    switch (status) {
      case PaymentApiStatus.SUCCEEDED:
        return 'สำเร็จ';
      case PaymentApiStatus.FAILED:
        return 'ล้มเหลว';
      case PaymentApiStatus.PENDING:
        return 'รอดำเนินการ';
      case PaymentApiStatus.CANCELLED:
        return 'ยกเลิก';
      default:
        return '-';
    }
  }

  async cancelEventLog(eventLogId: string, user?: AuthenticatedUser): Promise<DeviceEventLogRow> {
    this.logger.log(`Cancelling event log: ${eventLogId}`);

    // Check if user has permission (only ADMIN and TECHNICIAN can cancel)
    if (user?.permission?.name === PermissionType.USER) {
      throw new PermissionDeniedException('You do not have permission to cancel event logs');
    }

    // Find the event log - use findFirst since id is not a unique constraint by itself
    // The table has a compound primary key (id, created_at)
    const eventLog = await this.prisma.tbl_devices_events.findFirst({
      where: { id: eventLogId },
      select: {
        ...deviceEventLogsPublicSelect,
        payload: true,
        created_at: true,
      },
    });

    if (!eventLog) {
      throw new ItemNotFoundException('Event log not found');
    }

    // Check if already cancelled
    const payload = eventLog.payload as any;
    if (payload?.status === PaymentApiStatus.CANCELLED) {
      throw new BadRequestException('Event log is already cancelled');
    }

    // Update the payload status to CANCELLED
    const updatedPayload = {
      ...payload,
      status: PaymentApiStatus.CANCELLED,
    };

    // Update using compound primary key (id, created_at)
    const updatedEventLog = await this.prisma.tbl_devices_events.update({
      where: {
        id_created_at: {
          id: eventLog.id,
          created_at: eventLog.created_at,
        },
      },
      data: {
        payload: updatedPayload,
      },
      select: deviceEventLogsPublicSelect,
    });

    this.logger.log(`Successfully cancelled event log: ${eventLogId}`);

    // Refresh materialized views to ensure dashboard data is up-to-date
    // This blocks the response until views are refreshed, preventing race conditions
    await this.sqlScriptService.refreshAllViews();
    this.logger.log(`Materialized views refreshed after cancelling event log: ${eventLogId}`);

    return updatedEventLog;
  }
}
