<template>
  <v-card elevation="2" rounded="lg">
    <v-card-text class="pa-6 pa-sm-5 pa-xs-4">
      <div class="d-flex justify-space-between align-start ">
          <div class="text-body-2 text-medium-emphasis mb-2 font-weight-medium">
            {{ title }}
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

      <div
        class="text-h3 font-weight-bold text-high-emphasis mb-4"
        style="letter-spacing: -0.05em"
      >
        {{ formattedValue }}
      </div>

      <LineChart
        :chart-id="`kpi-chart-${chartId}`"
        :data="chartData"
        :labels="chartLabels"
        :title="title"
        :color="trendColor"
        :currency="currency"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  value: number;
  trend: number;
  chartData: number[];
  chartLabels: string[];
  chartId: string;
  currency?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currency: true,
});

const formattedValue = computed(() => {
  if (props.currency) {
    return `฿${props.value.toLocaleString("th-TH")}`;
  }
  return props.value.toLocaleString("th-TH");
});

const trendColor = computed(() => {
  return props.trend >= 0 ? "#4caf50" : "#f44336";
});

const trendIcon = computed(() => {
  return props.trend >= 0 ? "mdi-trending-up" : "mdi-trending-down";
});

const trendText = computed(() => {
  const sign = props.trend >= 0 ? "+" : "";
  return `${sign}${props.trend.toFixed(1)}%`;
});
</script>

<style scoped></style>
