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
}

export const useDashboardData = () => {
  const dashboardData: DashboardData = {
    yearRevenue: {
      value: 1200450,
      trend: 15.8,
      chartData: [850000, 920000, 1050000, 1200450],
      chartLabels: ['2022', '2023', '2024', '2025']
    },
    monthRevenue: {
      value: 60363.95,
      trend: -34.0,
      chartData: [
        45000, 38000, 52000, 65000, 58000, 72000,
        68000, 75000, 82000, 91500, 78000, 60363.95
      ],
      chartLabels: [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ]
    },
    dateRevenue: {
      value: 45000,
      trend: 24.2,
      chartData: [
        28000, 32000, 29000, 35000, 31000, 38000, 42000,
        39000, 36000, 41000, 44000, 38000, 43000, 46000,
        40000, 42000, 45000, 41000, 39000, 44000, 47000,
        43000, 41000, 38000, 42000, 46000, 44000, 41000,
        43000, 45000, 42000
      ],
      chartLabels: [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
        '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
        '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'
      ]
    }
  }

  return {
    dashboardData: readonly(dashboardData)
  }
}