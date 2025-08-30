import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { DashboardFilterDto } from './dto/dashboard.dto';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardSummary', () => {
    it('should return dashboard summary with default filters', async () => {
      const mockFilter: DashboardFilterDto = {};

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([{ total: 1000, year_start: new Date(), total_amount: 1000 }])
        .mockResolvedValueOnce([{ total: 500, month_start: new Date(), total_amount: 500 }])
        .mockResolvedValueOnce([{ total: 100, day: new Date(), total_amount: 100 }])
        .mockResolvedValueOnce([{ total: 50, hour_start: new Date(), total_amount: 50 }])
        .mockResolvedValueOnce([{ current_total: 1000 }])
        .mockResolvedValueOnce([{ previous_total: 800 }])
        .mockResolvedValueOnce([{ current_total: 500 }])
        .mockResolvedValueOnce([{ previous_total: 400 }])
        .mockResolvedValueOnce([{ current_total: 100 }])
        .mockResolvedValueOnce([{ previous_total: 80 }])
        .mockResolvedValueOnce([{ current_total: 50 }])
        .mockResolvedValueOnce([{ previous_total: 40 }]);

      const result = await service.getDashboardSummary(mockFilter);

      expect(result).toHaveProperty('yearly');
      expect(result).toHaveProperty('monthly');
      expect(result).toHaveProperty('daily');
      expect(result).toHaveProperty('hourly');
      expect(result.yearly).toHaveProperty('revenue');
      expect(result.yearly).toHaveProperty('change');
      expect(result.yearly).toHaveProperty('data');
      expect(result.hourly).toHaveProperty('revenue');
      expect(result.hourly).toHaveProperty('change');
      expect(result.hourly).toHaveProperty('data');
    });

    it('should apply user_id filter correctly', async () => {
      const mockFilter: DashboardFilterDto = {
        user_id: 'user123',
      };

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([{ total: 1000, year_start: new Date(), total_amount: 1000 }])
        .mockResolvedValueOnce([{ total: 500, month_start: new Date(), total_amount: 500 }])
        .mockResolvedValueOnce([{ total: 100, day: new Date(), total_amount: 100 }])
        .mockResolvedValueOnce([{ total: 50, hour_start: new Date(), total_amount: 50 }])
        .mockResolvedValueOnce([{ current_total: 1000 }])
        .mockResolvedValueOnce([{ previous_total: 800 }])
        .mockResolvedValueOnce([{ current_total: 500 }])
        .mockResolvedValueOnce([{ previous_total: 400 }])
        .mockResolvedValueOnce([{ current_total: 100 }])
        .mockResolvedValueOnce([{ previous_total: 80 }])
        .mockResolvedValueOnce([{ current_total: 50 }])
        .mockResolvedValueOnce([{ previous_total: 40 }]);

      await service.getDashboardSummary(mockFilter);

      // Verify that the query includes user_id filter
      expect(mockPrismaService.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining("d.owner_id = 'user123'")
      );
    });

    it('should include chart data when include_charts is true', async () => {
      const mockFilter: DashboardFilterDto = {
        include_charts: true,
      };

      const mockData = [
        { total: 1000, year_start: new Date('2025-01-01'), total_amount: 1000 },
        { total: 2000, year_start: new Date('2025-02-01'), total_amount: 2000 },
      ];

      const mockHourlyData = [
        { total: 50, hour_start: new Date('2025-08-24T14:00:00'), total_amount: 50 },
        { total: 75, hour_start: new Date('2025-08-24T15:00:00'), total_amount: 75 },
      ];

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockData)
        .mockResolvedValueOnce([{ total: 500, month_start: new Date(), total_amount: 500 }])
        .mockResolvedValueOnce([{ total: 100, day: new Date(), total_amount: 100 }])
        .mockResolvedValueOnce(mockHourlyData)
        .mockResolvedValueOnce([{ current_total: 3000 }])
        .mockResolvedValueOnce([{ previous_total: 2400 }])
        .mockResolvedValueOnce([{ current_total: 500 }])
        .mockResolvedValueOnce([{ previous_total: 400 }])
        .mockResolvedValueOnce([{ current_total: 100 }])
        .mockResolvedValueOnce([{ previous_total: 80 }])
        .mockResolvedValueOnce([{ current_total: 125 }])
        .mockResolvedValueOnce([{ previous_total: 100 }]);

      const result = await service.getDashboardSummary(mockFilter);

      expect(result.yearly.data).toBeDefined();
      expect(result.yearly.data).toHaveLength(2);
      expect(result.yearly.data[0]).toHaveProperty('date');
      expect(result.yearly.data[0]).toHaveProperty('amount');

      expect(result.hourly.data).toBeDefined();
      expect(result.hourly.data).toHaveLength(2);
      expect(result.hourly.data[0]).toHaveProperty('date');
      expect(result.hourly.data[0]).toHaveProperty('amount');
    });

    it('should calculate hourly percentage change correctly', async () => {
      const mockFilter: DashboardFilterDto = {};

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([{ total: 1000, year_start: new Date(), total_amount: 1000 }])
        .mockResolvedValueOnce([{ total: 500, month_start: new Date(), total_amount: 500 }])
        .mockResolvedValueOnce([{ total: 100, day: new Date(), total_amount: 100 }])
        .mockResolvedValueOnce([{ total: 50, hour_start: new Date(), total_amount: 50 }])
        .mockResolvedValueOnce([{ current_total: 1000 }])
        .mockResolvedValueOnce([{ previous_total: 800 }])
        .mockResolvedValueOnce([{ current_total: 500 }])
        .mockResolvedValueOnce([{ previous_total: 400 }])
        .mockResolvedValueOnce([{ current_total: 100 }])
        .mockResolvedValueOnce([{ previous_total: 80 }])
        .mockResolvedValueOnce([{ current_total: 50 }])
        .mockResolvedValueOnce([{ previous_total: 40 }]);

      const result = await service.getDashboardSummary(mockFilter);

      // 50 - 40 = 10, 10/40 * 100 = 25%
      expect(result.hourly.change).toBe(25);
    });
  });
});
