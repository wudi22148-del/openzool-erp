<template>
  <div ref="chartRef" :style="{ width: '100%', height: '100%' }"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';

interface Props {
  data?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
});

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

function initChart() {
  if (!chartRef.value) return;

  chartInstance = echarts.init(chartRef.value);

  const option: echarts.EChartsOption = {
    grid: {
      left: 0,
      right: 0,
      top: 5,
      bottom: 5,
    },
    xAxis: {
      type: 'category',
      show: false,
      data: props.data.map((_, index) => index),
    },
    yAxis: {
      type: 'value',
      show: false,
    },
    series: [
      {
        data: props.data,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#1890ff',
          width: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
          ]),
        },
      },
    ],
  };

  chartInstance.setOption(option);
}

watch(
  () => props.data,
  () => {
    if (chartInstance) {
      chartInstance.setOption({
        xAxis: {
          data: props.data.map((_, index) => index),
        },
        series: [
          {
            data: props.data,
          },
        ],
      });
    }
  },
  { deep: true }
);

onMounted(() => {
  initChart();

  window.addEventListener('resize', () => {
    chartInstance?.resize();
  });
});
</script>
