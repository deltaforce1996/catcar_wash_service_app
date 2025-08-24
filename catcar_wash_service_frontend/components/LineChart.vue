<template>
  <div class="chart-container">
    <Line
      :id="chartId"
      ref="chartRef"
      :options="chartOptions"
      :data="chartData"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Line } from "vue-chartjs";
import { useTheme } from "vuetify";
import { computed, ref } from "vue";

const theme  = useTheme();

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const chartRef = ref();

interface Props {
  chartId: string;
  data: number[];
  labels: string[];
  title: string;
  currency?: boolean;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currency: true,
  color: "#f57f2a",
});

const chartData = computed(
  (): ChartData<"line"> => ({
    labels: props.labels,
    datasets: [
      {
        data: props.data,
        borderColor: props.color,
        backgroundColor: props.color + "20",
        borderWidth: 3,
        pointBackgroundColor: props.color,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: false,
      },
    ],
  })
);

const chartOptions = computed(
  (): ChartOptions<"line"> => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 10,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: theme.current.value.colors.surface,
        titleColor: theme.current.value.colors["on-surface"],
        bodyColor: theme.current.value.colors["on-surface"],
        borderColor: props.color,
        borderWidth: 2,
        cornerRadius: 8,
        titleFont: {
          size: 13,
          weight: 600,
        },
        bodyFont: {
          size: 12,
        },
        padding: 12,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            if (props.currency) {
              return `รายได้: ฿${value.toLocaleString("th-TH")}`;
            }
            return `ค่า: ${value.toLocaleString("th-TH")}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: theme.current.value.colors["surface-variant"],
          drawOnChartArea: true,
          drawTicks: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: theme.current.value.colors["on-surface-variant"],
          font: {
            size: 11,
            weight: 500,
            family: "system-ui",
          },
          padding: 8,
          maxRotation: 0,
        },
      },
      y: {
        display: true,
        position: "left",
        grid: {
          display: true,
          color: theme.current.value.colors["surface-variant"],
          drawOnChartArea: true,
          drawTicks: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: theme.current.value.colors["on-surface-variant"],
          font: {
            size: 10,
            weight: 500,
            family: "system-ui",
          },
          padding: 8,
          callback: function (value: string | number) {
            if (props.currency) {
              return (
                "฿" +
                Number(value).toLocaleString("th-TH", {
                  maximumFractionDigits: 0,
                })
              );
            }
            return Number(value).toLocaleString("th-TH");
          },
        },
      },
    },
    elements: {
      line: {
        borderJoinStyle: "round",
      },
      point: {
        hoverRadius: 8,
        hoverBorderWidth: 3,
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  })
);
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 200px;
  width: 100%;
}
</style>
