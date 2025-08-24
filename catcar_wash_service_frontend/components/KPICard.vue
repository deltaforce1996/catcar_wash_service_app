<template>
  <v-card
    class="kpi-card h-100"
    elevation="1"
    rounded="lg"
  >
    <v-card-text class="pa-8">
      <div class="d-flex justify-space-between align-start mb-4">
        <div>
          <div class="text-body-2 text-medium-emphasis mb-2 font-weight-medium">
            {{ title }}
          </div>
          <div class="text-h3 font-weight-bold text-high-emphasis" style="letter-spacing: -0.05em;">
            {{ formattedValue }}
          </div>
        </div>
        <v-chip
          :color="props.trend >= 0 ? 'success' : 'error'"
          :prepend-icon="trendIcon"
          variant="tonal"
          size="small"
          class="font-weight-medium"
        >
          {{ trendText }}
        </v-chip>
      </div>
      
      <div class="chart-wrapper">
        <LineChart
          :chart-id="`kpi-chart-${chartId}`"
          :data="chartData"
          :labels="chartLabels"
          :title="title"
          :color="trendColor"
          :currency="currency"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: number
  trend: number
  chartData: number[]
  chartLabels: string[]
  chartId: string
  currency?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currency: true
})

const formattedValue = computed(() => {
  if (props.currency) {
    return `฿${props.value.toLocaleString('th-TH')}`
  }
  return props.value.toLocaleString('th-TH')
})

const trendColor = computed(() => {
  return props.trend >= 0 ? '#4caf50' : '#f44336'
})

const trendIcon = computed(() => {
  return props.trend >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'
})

const trendText = computed(() => {
  const sign = props.trend >= 0 ? '+' : ''
  return `${sign}${props.trend.toFixed(1)}%`
})
</script>

<style scoped>
.kpi-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(var(--v-border-color), 0.08);
  background: rgba(var(--v-theme-surface), 1);
  /* overflow: hidden; */
}

.kpi-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 48px -8px rgba(0, 0, 0, 0.12) !important;
  border-color: rgba(var(--v-border-color), 0.16);
}

.chart-wrapper {
  margin-top: 20px;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

/* Mobile responsive adjustments */
@media (max-width: 960px) {
  .kpi-card :deep(.v-card-text) {
    padding: 20px !important;
  }
  
  .chart-wrapper {
    height: 120px;
    margin-top: 16px;
  }
}

@media (max-width: 600px) {
  .kpi-card :deep(.v-card-text) {
    padding: 16px !important;
  }
  
  .chart-wrapper {
    height: 100px;
    margin-top: 12px;
  }
}
</style>