<script setup>
import { ref, onMounted, nextTick } from 'vue';
import Chart from 'chart.js/auto';
import DepositStatsCard from "./components/DepositStatsCard.vue";
import WithdrawalStatsCard from "./components/WithdrawalStatsCard.vue";
import ActiveClientsCard from "./components/ActiveClientsCard.vue";
import KYCStatsCard from "./components/KYCStatsCrad.vue";
import OpenTicketsCard from "./components/OpenTicketsCard.vue";
import UsersWithoutKYCCard from "./components/UsersWithoutKYCCard.vue";
import { useDepositStats } from '@/utils/DepositStats.js';
import { useWithdrawalStats } from '@/utils/WithdrawalStats.js';

// Chart data
const depositChartData = ref({
  labels: [],
  datasets: [{
    label: 'Total Deposits',
    data: [],
  }]
});

const withdrawalChartData = ref({
  labels: [],
  datasets: [{
    label: 'Total Withdrawals',
    data: [],
  }]
});

const depositPeriod = ref('1month');
const withdrawalPeriod = ref('1month');
const loadingDepositChart = ref(false);
const loadingWithdrawalChart = ref(false);

const depositChartInstance = ref(null);
const withdrawalChartInstance = ref(null);

const { fetchDepositsForChart } = useDepositStats();
const { fetchWithdrawalsForChart } = useWithdrawalStats();

// Process chart data by month
const processChartData = (transactions, period) => {
  const now = new Date();
  let months = [];
  
  if (period === '1month') {
    // For 1 month, show last 4 weeks grouped by week
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - 6);
      weekStart.setHours(0, 0, 0, 0);
      // Get Sunday of that week
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = weekEnd.toLocaleDateString('en-US', { day: 'numeric' });
      weeks.push(`${startStr} - ${endStr}`);
    }
    months = weeks;
  } else if (period === '3months') {
    months = [2, 1, 0].map(i => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
  } else if (period === '6months') {
    months = [5, 4, 3, 2, 1, 0].map(i => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
  } else if (period === '1year') {
    months = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(i => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
  }

  const monthlyData = {};
  months.forEach(month => {
    monthlyData[month] = 0;
  });

  transactions.forEach(transaction => {
    const date = new Date(transaction.created_at || transaction.date);
    let key;
    
    if (period === '1month') {
      // For 1 month, group by week - find which week this date belongs to
      const weekStart = new Date(date);
      weekStart.setHours(0, 0, 0, 0);
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek); // Get Sunday of the week
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Get Saturday of the week
      weekEnd.setHours(23, 59, 59, 999);
      
      const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = weekEnd.toLocaleDateString('en-US', { day: 'numeric' });
      key = `${startStr} - ${endStr}`;
    } else {
      // For other periods, group by month
      key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    
    if (Object.prototype.hasOwnProperty.call(monthlyData, key)) {
      monthlyData[key] += parseFloat(transaction.amount || 0);
    }
  });

  return {
    labels: months,
    data: months.map(month => monthlyData[month] || 0)
  };
};

// Load deposit chart data
const loadDepositChart = async () => {
  loadingDepositChart.value = true;
  try {
    const deposits = await fetchDepositsForChart(depositPeriod.value);
    console.log('Deposits fetched:', deposits.length, deposits);
    const processed = processChartData(deposits, depositPeriod.value);
    console.log('Processed chart data:', processed);
    depositChartData.value = {
      labels: processed.labels,
      datasets: [{
        label: 'Total Deposits',
        data: processed.data,
      }]
    };
    
    await nextTick();
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      renderDepositChart();
    }, 100);
  } catch (err) {
    console.error('Error loading deposit chart:', err);
  } finally {
    loadingDepositChart.value = false;
  }
};

// Load withdrawal chart data
const loadWithdrawalChart = async () => {
  loadingWithdrawalChart.value = true;
  try {
    const withdrawals = await fetchWithdrawalsForChart(withdrawalPeriod.value);
    console.log('Withdrawals fetched:', withdrawals.length, withdrawals);
    const processed = processChartData(withdrawals, withdrawalPeriod.value);
    console.log('Processed chart data:', processed);
    withdrawalChartData.value = {
      labels: processed.labels,
      datasets: [{
        label: 'Total Withdrawals',
        data: processed.data,
      }]
    };
    
    await nextTick();
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      renderWithdrawalChart();
    }, 100);
  } catch (err) {
    console.error('Error loading withdrawal chart:', err);
  } finally {
    loadingWithdrawalChart.value = false;
  }
};

// Render deposit chart
const renderDepositChart = () => {
  const canvas = document.getElementById('chart-deposits');
  if (!canvas) {
    console.warn('Chart canvas not found, retrying...');
    setTimeout(() => renderDepositChart(), 100);
    return;
  }
  
  if (depositChartInstance.value) {
    depositChartInstance.value.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get 2d context from canvas');
    return;
  }
  
  const gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);
  gradientStroke.addColorStop(1, 'rgba(82, 214, 22, 0.2)');
  gradientStroke.addColorStop(0.2, 'rgba(72, 72, 176, 0.0)');
  gradientStroke.addColorStop(0, 'rgba(82, 214, 22, 0)');
  
  depositChartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: depositChartData.value.labels,
      datasets: [{
        label: depositChartData.value.datasets[0].label,
        tension: 0.4,
        pointRadius: 0,
        borderColor: '#52d616',
        backgroundColor: gradientStroke,
        borderWidth: 3,
        fill: true,
        data: depositChartData.value.datasets[0].data,
        maxBarThickness: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      scales: {
        y: {
          grid: {
            drawBorder: false,
            display: true,
            drawOnChartArea: true,
            drawTicks: false,
            borderDash: [5, 5],
          },
          ticks: {
            display: true,
            padding: 10,
            color: '#9ca2b7',
            font: {
              size: 11,
              family: 'Open Sans',
              style: 'normal',
              lineHeight: 2,
            },
          },
        },
        x: {
          grid: {
            drawBorder: false,
            display: false,
            drawOnChartArea: false,
            drawTicks: false,
            borderDash: [5, 5],
          },
          ticks: {
            display: true,
            color: '#9ca2b7',
            padding: 20,
            font: {
              size: 11,
              family: 'Open Sans',
              style: 'normal',
              lineHeight: 2,
            },
          },
        },
      },
    },
  });
};

// Render withdrawal chart
const renderWithdrawalChart = () => {
  const canvas = document.getElementById('chart-withdrawals');
  if (!canvas) {
    console.warn('Chart canvas not found, retrying...');
    setTimeout(() => renderWithdrawalChart(), 100);
    return;
  }
  
  if (withdrawalChartInstance.value) {
    withdrawalChartInstance.value.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get 2d context from canvas');
    return;
  }
  
  const gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);
  gradientStroke.addColorStop(1, 'rgba(234, 6, 6, 0.2)');
  gradientStroke.addColorStop(0.2, 'rgba(72, 72, 176, 0.0)');
  gradientStroke.addColorStop(0, 'rgba(234, 6, 6, 0)');
  
  withdrawalChartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: withdrawalChartData.value.labels,
      datasets: [{
        label: withdrawalChartData.value.datasets[0].label,
        tension: 0.4,
        pointRadius: 0,
        borderColor: '#ea0606',
        backgroundColor: gradientStroke,
        borderWidth: 3,
        fill: true,
        data: withdrawalChartData.value.datasets[0].data,
        maxBarThickness: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      scales: {
        y: {
          grid: {
            drawBorder: false,
            display: true,
            drawOnChartArea: true,
            drawTicks: false,
            borderDash: [5, 5],
          },
          ticks: {
            display: true,
            padding: 10,
            color: '#9ca2b7',
            font: {
              size: 11,
              family: 'Open Sans',
              style: 'normal',
              lineHeight: 2,
            },
          },
        },
        x: {
          grid: {
            drawBorder: false,
            display: false,
            drawOnChartArea: false,
            drawTicks: false,
            borderDash: [5, 5],
          },
          ticks: {
            display: true,
            color: '#9ca2b7',
            padding: 20,
            font: {
              size: 11,
              family: 'Open Sans',
              style: 'normal',
              lineHeight: 2,
            },
          },
        },
      },
    },
  });
};

// Watch period changes
const onDepositPeriodChange = () => {
  loadDepositChart();
};

const onWithdrawalPeriodChange = () => {
  loadWithdrawalChart();
};

onMounted(async () => {
  // Wait for DOM to be fully ready
  await nextTick();
  setTimeout(() => {
    loadDepositChart();
    loadWithdrawalChart();
  }, 200);
});
</script>

<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-lg-12">
        <!-- Statistics Cards Row 1 -->
        <div class="row mb-4">
          <div class="col-lg-3 col-md-6 col-12 mb-3">
            <DepositStatsCard />
          </div>
          <div class="col-lg-3 col-md-6 col-12 mb-3">
            <WithdrawalStatsCard />
          </div>
          <div class="col-lg-3 col-md-6 col-12 mb-3">
            <ActiveClientsCard />
          </div>
          <div class="col-lg-3 col-md-6 col-12 mb-3">
            <KYCStatsCard />
          </div>
        </div>

        <!-- Statistics Cards Row 2 -->
        <div class="row mb-4">
          <div class="col-lg-6 col-md-6 col-12 mb-3">
            <OpenTicketsCard />
          </div>
          <div class="col-lg-6 col-md-6 col-12 mb-3">
            <UsersWithoutKYCCard />
          </div>
        </div>

        <!-- Charts Row -->
        <div class="row">
          <!-- Deposits Chart -->
          <div class="col-lg-6 col-md-12 col-12 mb-4">
            <div class="card z-index-2 border-0 shadow-sm">
              <div class="pb-0 card-header mb-0 chart-header">
                <div class="chart-title-section">
                  <h6 class="mb-0">Total Deposits Overview</h6>
                  <p class="text-sm text-muted mb-0">Approved deposits over time</p>
                </div>
                <div class="btn-group period-selector" role="group">
                  <button
                    type="button"
                    class="btn btn-sm period-btn"
                    :class="depositPeriod === '1month' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="depositPeriod = '1month'; onDepositPeriodChange()"
                  >
                    1M
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm period-btn"
                    :class="depositPeriod === '3months' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="depositPeriod = '3months'; onDepositPeriodChange()"
                  >
                    3M
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm period-btn"
                    :class="depositPeriod === '6months' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="depositPeriod = '6months'; onDepositPeriodChange()"
                  >
                    6M
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm period-btn"
                    :class="depositPeriod === '1year' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="depositPeriod = '1year'; onDepositPeriodChange()"
                  >
                    1Y
                  </button>
                </div>
              </div>
              <div class="p-3 card-body">
                <div v-if="loadingDepositChart" class="text-center py-5">
                  <i class="fas fa-spinner fa-spin fa-2x text-muted"></i>
                  <p class="text-muted mt-2">Loading chart data...</p>
                </div>
                <div v-else-if="!depositChartData.labels || depositChartData.labels.length === 0" class="text-center py-5">
                  <i class="fas fa-chart-line fa-2x text-muted"></i>
                  <p class="text-muted mt-2">No deposit data available for the selected period</p>
                </div>
                <div v-else style="position: relative; height: 300px;">
                  <canvas
                    id="chart-deposits"
                    style="max-height: 300px;"
                  ></canvas>
                </div>
              </div>
            </div>
          </div>

          <!-- Withdrawals Chart -->
          <div class="col-lg-6 col-md-12 col-12 mb-4">
            <div class="card z-index-2 border-0 shadow-sm">
              <div class="pb-0 card-header mb-0 chart-header">
                <div class="chart-title-section">
                  <h6 class="mb-0">Total Withdrawals Overview</h6>
                  <p class="text-sm text-muted mb-0">Approved withdrawals over time</p>
                </div>
                <div class="btn-group period-selector" role="group">
                  <button
                    type="button"
                    class="btn btn-sm period-btn"
                    :class="withdrawalPeriod === '1month' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="withdrawalPeriod = '1month'; onWithdrawalPeriodChange()"
                  >
                    1M
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm period-btn"
                    :class="withdrawalPeriod === '3months' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="withdrawalPeriod = '3months'; onWithdrawalPeriodChange()"
                  >
                    3M
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm period-btn"
                    :class="withdrawalPeriod === '6months' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="withdrawalPeriod = '6months'; onWithdrawalPeriodChange()"
                  >
                    6M
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm period-btn"
                    :class="withdrawalPeriod === '1year' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="withdrawalPeriod = '1year'; onWithdrawalPeriodChange()"
                  >
                    1Y
                  </button>
                </div>
                        </div>
              <div class="p-3 card-body">
                <div v-if="loadingWithdrawalChart" class="text-center py-5">
                  <i class="fas fa-spinner fa-spin fa-2x text-muted"></i>
                  <p class="text-muted mt-2">Loading chart data...</p>
                        </div>
                <div v-else-if="!withdrawalChartData.labels || withdrawalChartData.labels.length === 0" class="text-center py-5">
                  <i class="fas fa-chart-line fa-2x text-muted"></i>
                  <p class="text-muted mt-2">No withdrawal data available for the selected period</p>
                        </div>
                <div v-else style="position: relative; height: 300px;">
                  <canvas
                    id="chart-withdrawals"
                    style="max-height: 300px;"
                  ></canvas>
                        </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.icon-shape {
  transition: transform 0.2s;
}

.card:hover .icon-shape {
  transform: scale(1.1);
}

.btn-group .btn {
  border-radius: 0;
}

.btn-group .btn:first-child {
  border-top-left-radius: 0.375rem;
  border-bottom-left-radius: 0.375rem;
}

.btn-group .btn:last-child {
  border-top-right-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}

/* Chart Header Responsive */
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.chart-title-section {
  flex: 1;
  min-width: 200px;
}

.period-selector {
  flex-shrink: 0;
}

.period-btn {
  min-width: 45px;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .chart-title-section {
    width: 100%;
    margin-bottom: 0.5rem;
  }
  
  .period-selector {
    width: 100%;
    display: flex;
  }
  
  .period-selector .period-btn {
    flex: 1;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
  
  .card-body {
    padding: 1rem !important;
  }
  
  /* Make charts stack on mobile */
  .col-lg-6 {
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 576px) {
  .period-btn {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
    min-width: 40px;
  }
  
  .chart-title-section h6 {
    font-size: 0.9rem;
  }
  
  .chart-title-section p {
    font-size: 0.75rem;
  }
}
</style>
