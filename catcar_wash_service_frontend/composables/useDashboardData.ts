export interface RevenueData {
  value: number
  trend: number
  chartData: number[]
  chartLabels: string[]
}

export interface DashboardData {
  yearRevenue: RevenueData
  monthRevenue: RevenueData
  dateRevenue: RevenueData
  hourlyRevenue: RevenueData
}

export const useDashboardData = () => {
  const dashboardData: DashboardData = {
    yearRevenue: {
      value: 1200450,
      trend: 14.29,
      chartData: [850000, 920000, 1050000, 1200450],
      chartLabels: ['2022', '2023', '2024', '2025']
    },
    monthRevenue: {
      value: 60363.95,
      trend: -34.04,
      chartData: [
        91500, 95000, 84000, 78000, 65000,
        75000, 62000, 60363.95
      ],
      chartLabels: [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ]
    },
    dateRevenue: {
      value: 4200,
      trend: 150.0,
      chartData: [
        2800, 3200, 2900, 3500, 3100, 3800, 4200,
        3900, 3600, 4100, 4400, 3800, 4300, 4600,
        4000, 4200, 4500, 4100, 3900, 4400, 4700,
        4300, 4100, 3800, 4200,
      ],
      chartLabels: [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
        '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
        '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'
      ]
    },
    hourlyRevenue: {
      value: 750,
      trend: -11.76,
      chartData: [
        850, 920, 1200, 1450, 1680, 1820, 2100, 2350,
        2180, 1950, 1760, 1580, 1420, 1680, 1920, 2240,
        2380, 2150, 1875, 1650, 1420, 1180, 980, 750
      ],
      chartLabels: [
        '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
      ]
    }
  }

  return {
    dashboardData: dashboardData
  }
}