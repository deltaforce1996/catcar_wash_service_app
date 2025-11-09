import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class SqlScriptService {
  private readonly logger = new Logger(SqlScriptService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Refresh all materialized views concurrently
   * Uses Promise.all() to refresh all views in parallel for better performance
   */
  async refreshAllViews(): Promise<void> {
    this.logger.log('Refreshing all materialized views in parallel...');

    await Promise.all([
      this.prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_day`,
      this.prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_month`,
      this.prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_year`,
      this.prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_hour`,
    ]);

    this.logger.log('All materialized views refreshed successfully!');
  }

  /**
   * Execute SQL script
   * @param sql - SQL script to execute
   */
  async runSqlScript(sql: string): Promise<any> {
    this.logger.log(`Executing SQL script: ${sql.substring(0, 100)}...`);

    try {
      const result = await this.prisma.$queryRawUnsafe(sql);
      this.logger.log('SQL script executed successfully');
      return result;
    } catch (error) {
      this.logger.error(`Failed to execute SQL script: ${error.message}`);
      throw error;
    }
  }
}
