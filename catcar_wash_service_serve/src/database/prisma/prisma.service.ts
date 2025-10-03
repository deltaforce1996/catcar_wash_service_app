import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  [x: string]: any;
  constructor(config: ConfigService) {
    super({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: config.get<string>(
            'DATABASE_URL',
            'postgresql://postgres:password@localhost:5432/catcar_wash_db_dev?schema=public',
          ),
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
