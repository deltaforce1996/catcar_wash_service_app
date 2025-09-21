import { Injectable } from '@nestjs/common';
import { PaymentApiStatus, PermissionType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { DashboardFilterDto } from './dto/dashboard.dto';
import { AuthenticatedUser } from 'src/types/internal.type';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(filter: DashboardFilterDto, user?: AuthenticatedUser) {
    // สร้าง WHERE conditions สำหรับ filter
    const whereConditions = this.buildWhereConditions(filter, user);

    // Query ข้อมูลรายได้รายเดือน
    const monthlyRevenue = await this.getMonthlyRevenue(whereConditions);

    // Query ข้อมูลรายได้รายวัน
    const dailyRevenue = await this.getDailyRevenue(whereConditions, filter);

    // Query ข้อมูลรายได้รายชั่วโมง
    const hourlyRevenue = await this.getHourlyRevenue(whereConditions, filter);

    // คำนวณ percentage change
    const monthlyChange = await this.calculatePercentageChange('month', whereConditions, filter);
    const dailyChange = await this.calculatePercentageChange('day', whereConditions, filter);
    const hourlyChange = await this.calculatePercentageChange('hour', whereConditions, filter);

    return {
      monthly: {
        revenue: monthlyRevenue.total,
        change: Number(monthlyChange.toFixed(2)),
        data: filter.include_charts ? monthlyRevenue.data : null,
      },
      daily: {
        revenue: dailyRevenue.total,
        change: Number(dailyChange.toFixed(2)),
        data: filter.include_charts ? dailyRevenue.data : null,
      },
      hourly: {
        revenue: hourlyRevenue.total,
        change: Number(hourlyChange.toFixed(2)),
        data: filter.include_charts ? hourlyRevenue.data : null,
      },
      payment_status: filter.payment_status || 'SUCCESS',
    };
  }

  private buildWhereConditions(filter: DashboardFilterDto, user?: AuthenticatedUser): string {
    const conditions: string[] = [];

    // Add permission-based filtering for USER role
    if (user?.permission?.name === PermissionType.USER) {
      conditions.push(`d.owner_id = '${user.id}'`);
    }

    if (filter.user_id) {
      conditions.push(`d.owner_id = '${filter.user_id}'`);
    }

    if (filter.device_id) {
      conditions.push(`mv.device_id = '${filter.device_id}'`);
    }

    if (filter.device_status) {
      conditions.push(`d.status = '${filter.device_status}'`);
    }

    if (filter.device_type) {
      conditions.push(`d.type = '${filter.device_type}'`);
    }

    if (filter.payment_status) {
      conditions.push(`mv.status = '${filter.payment_status}'`);
    } else {
      // Default to SUCCESS if not specified
      conditions.push(`mv.status = '${PaymentApiStatus.SUCCEEDED}'`);
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  private buildDateCondition(filter: DashboardFilterDto, dateColumn: string): string {
    if (filter.date) {
      return `AND DATE(${dateColumn}) = DATE('${filter.date}')`;
    }
    return '';
  }

  private async getMonthlyRevenue(whereConditions: string) {
    const query = `
      WITH months AS (
        SELECT generate_series(1, 12) as month_num
      ),
      monthly_data AS (
        SELECT 
          EXTRACT(MONTH FROM mv.month_start) as month_num,
          COALESCE(SUM(mv.total_amount), 0) as total_amount
        FROM mv_device_payments_month mv
        INNER JOIN tbl_devices d ON mv.device_id = d.id
        ${whereConditions}
        GROUP BY EXTRACT(MONTH FROM mv.month_start)
      )
      SELECT 
        m.month_num,
        COALESCE(md.total_amount, 0) as total_amount
      FROM months m
      LEFT JOIN monthly_data md ON m.month_num = md.month_num
      ORDER BY m.month_num
    `;

    const result = await this.prisma.$queryRaw<Array<{ month_num: number; total_amount: number }>>(Prisma.raw(query));

    const total = result.reduce((sum, row) => sum + Number(row.total_amount), 0);

    return {
      total,
      data: result.map((row) => ({
        month: String(row.month_num).padStart(2, '0'),
        amount: Number(row.total_amount),
      })),
    };
  }

  private async getDailyRevenue(whereConditions: string, filter: DashboardFilterDto) {
    // กรองเฉพาะเดือนของวันที่เลือก (ไม่ใช่เฉพาะวัน)
    const monthCondition = filter.date
      ? `AND EXTRACT(MONTH FROM mv.day) = EXTRACT(MONTH FROM DATE('${filter.date}')) AND EXTRACT(YEAR FROM mv.day) = EXTRACT(YEAR FROM DATE('${filter.date}'))`
      : '';
    const query = `
      WITH days AS (
        SELECT generate_series(1, 31) as day_num
      ),
      daily_data AS (
        SELECT 
          EXTRACT(DAY FROM mv.day) as day_num,
          COALESCE(SUM(mv.total_amount), 0) as total_amount
        FROM mv_device_payments_day mv
        INNER JOIN tbl_devices d ON mv.device_id = d.id
        ${whereConditions} ${monthCondition}
        GROUP BY EXTRACT(DAY FROM mv.day)
      )
      SELECT 
        d.day_num,
        COALESCE(dd.total_amount, 0) as total_amount
      FROM days d
      LEFT JOIN daily_data dd ON d.day_num = dd.day_num
      ORDER BY d.day_num
    `;

    const result = await this.prisma.$queryRaw<Array<{ day_num: number; total_amount: number }>>(Prisma.raw(query));

    const total = result.reduce((sum, row) => sum + Number(row.total_amount), 0);

    return {
      total,
      data: result.map((row) => ({
        day: String(row.day_num).padStart(2, '0'),
        amount: Number(row.total_amount),
      })),
    };
  }

  private async getHourlyRevenue(whereConditions: string, filter: DashboardFilterDto) {
    const dateCondition = this.buildDateCondition(filter, 'mv.hour_start');
    const query = `
      WITH hours AS (
        SELECT generate_series(0, 23) as hour_num
      ),
      hourly_data AS (
        SELECT 
          EXTRACT(HOUR FROM mv.hour_start) as hour_num,
          COALESCE(SUM(mv.total_amount), 0) as total_amount
        FROM mv_device_payments_hour mv
        INNER JOIN tbl_devices d ON mv.device_id = d.id
        ${whereConditions} ${dateCondition}
        GROUP BY EXTRACT(HOUR FROM mv.hour_start)
      )
      SELECT 
        h.hour_num,
        COALESCE(hd.total_amount, 0) as total_amount
      FROM hours h
      LEFT JOIN hourly_data hd ON h.hour_num = hd.hour_num
      ORDER BY h.hour_num
    `;

    const result = await this.prisma.$queryRaw<Array<{ hour_num: number; total_amount: number }>>(Prisma.raw(query));

    const total = result.reduce((sum, row) => sum + Number(row.total_amount), 0);

    return {
      total,
      data: result.map((row) => ({
        hour: String(row.hour_num).padStart(2, '0'),
        amount: Number(row.total_amount),
      })),
    };
  }

  private async calculatePercentageChange(
    period: 'month' | 'day' | 'hour',
    whereConditions: string,
    filter: DashboardFilterDto,
  ) {
    let currentQuery: string;
    let previousQuery: string;

    if (period === 'month') {
      // Monthly - เปรียบเทียบกับปีที่แล้ว
      currentQuery = `
        SELECT COALESCE(SUM(mv.total_amount), 0) as current_total
        FROM mv_device_payments_month mv
        INNER JOIN tbl_devices d ON mv.device_id = d.id
        ${whereConditions}
        AND EXTRACT(YEAR FROM mv.month_start) = EXTRACT(YEAR FROM NOW())
      `;

      previousQuery = `
        SELECT COALESCE(SUM(mv.total_amount), 0) as previous_total
        FROM mv_device_payments_month mv
        INNER JOIN tbl_devices d ON mv.device_id = d.id
        ${whereConditions}
        AND EXTRACT(YEAR FROM mv.month_start) = EXTRACT(YEAR FROM NOW()) - 1
      `;
    } else if (period === 'day') {
      // Daily - เปรียบเทียบกับเดือนก่อนหน้า
      const monthCondition = filter.date
        ? `AND EXTRACT(MONTH FROM mv.day) = EXTRACT(MONTH FROM DATE('${filter.date}')) AND EXTRACT(YEAR FROM mv.day) = EXTRACT(YEAR FROM DATE('${filter.date}'))`
        : '';

      currentQuery = `
        SELECT COALESCE(SUM(mv.total_amount), 0) as current_total
        FROM mv_device_payments_day mv
        INNER JOIN tbl_devices d ON mv.device_id = d.id
        ${whereConditions} ${monthCondition}
      `;

      previousQuery = `
        SELECT COALESCE(SUM(mv.total_amount), 0) as previous_total
        FROM mv_device_payments_day mv
        INNER JOIN tbl_devices d ON mv.device_id = d.id
        ${whereConditions}
        AND EXTRACT(MONTH FROM mv.day) = EXTRACT(MONTH FROM DATE('${filter.date}') - INTERVAL '1 month')
        AND EXTRACT(YEAR FROM mv.day) = EXTRACT(YEAR FROM DATE('${filter.date}') - INTERVAL '1 month')
      `;
    } else {
      // Hourly - เปรียบเทียบกับวันก่อนหน้า
      const dateCondition = this.buildDateCondition(filter, 'mv.hour_start');

      currentQuery = `
        SELECT COALESCE(SUM(mv.total_amount), 0) as current_total
        FROM mv_device_payments_hour mv
        INNER JOIN tbl_devices d ON mv.device_id = d.id
        ${whereConditions} ${dateCondition}
      `;

      previousQuery = `
        SELECT COALESCE(SUM(mv.total_amount), 0) as previous_total
        FROM mv_device_payments_hour mv
        INNER JOIN tbl_devices d ON mv.device_id = d.id
        ${whereConditions}
        AND DATE(mv.hour_start) = DATE('${filter.date}') - INTERVAL '1 day'
      `;
    }

    const currentResult = await this.prisma.$queryRaw<Array<{ current_total: number }>>(Prisma.raw(currentQuery));
    const currentTotal = Number(currentResult[0]?.current_total || 0);

    const previousResult = await this.prisma.$queryRaw<Array<{ previous_total: number }>>(Prisma.raw(previousQuery));
    const previousTotal = Number(previousResult[0]?.previous_total || 0);

    if (previousTotal === 0) {
      return currentTotal > 0 ? 100 : 0;
    }

    return ((currentTotal - previousTotal) / previousTotal) * 100;
  }
}
