<script setup>
import { onMounted } from 'vue';
import { useTradingAccounts } from '@/utils/Tradingaccount.js';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const {
  loading,
  errorMessage,
  fetchTradingAccounts,
  getTotalBalance,
  getTotalEquity,
  getAccountsCount,
  getEnabledAccountsCount,
  formatCurrency,
  clearMessages
} = useTradingAccounts();

const refreshData = async () => {
  clearMessages();
  try {
    await fetchTradingAccounts(true);
  } catch (error) {
    console.error('Failed to refresh trading accounts:', error);
    // Error message already set in composable
  }
};

onMounted(async () => {
  try {
    await fetchTradingAccounts();
  } catch (error) {
    console.error('Failed to load trading accounts:', error);
    // Error message already set in composable
  }
});
</script>

<template>
  <div class="card border-0 shadow-sm">
    <div class="card-body p-4">
      <h5 class="mb-4 fw-bold text-dark">Trading Accounts Summary</h5>
      
      <!-- Content Container with Fixed Height -->
      <div class="content-container">
        <!-- Loading State -->
        <div v-if="loading" class="loading-wrapper">
          <LoadingSpinner text="Loading accounts..." />
        </div>

        <!-- Error State -->
        <div v-else-if="errorMessage" class="error-wrapper">
          <div class="text-center">
            <i class="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
            <p class="text-danger mb-3 fw-bold">{{ errorMessage }}</p>
            <button 
              class="btn btn-sm"
              style="background-color: #111111; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600;"
              @click="refreshData"
            >
              <i class="fas fa-sync-alt me-2"></i>
              Try Again
            </button>
          </div>
        </div>
      
        <!-- Accounts Summary -->
        <div v-else class="summary-content">
          <div class="row g-3">
            <!-- Total Accounts -->
            <div class="col-md-6">
              <div class="summary-item p-3 bg-light rounded">
                <div class="d-flex align-items-center">
                  <div class="icon-wrapper icon-gray me-3">
                    <i class="fas fa-layer-group"></i>
                  </div>
                  <div>
                    <p class="mb-0 text-muted small">Total Accounts</p>
                    <h4 class="mb-0 fw-bold text-dark">{{ getAccountsCount }}</h4>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Active Accounts -->
            <div class="col-md-6">
              <div class="summary-item p-3 bg-light rounded">
                <div class="d-flex align-items-center">
                  <div class="icon-wrapper icon-gray me-3">
                      <i class="fas fa-circle-check"></i>
                  </div>
                  <div>
                    <p class="mb-0 text-muted small">Active Accounts</p>
                    <h4 class="mb-0 fw-bold text-dark">{{ getEnabledAccountsCount }}</h4>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Total Balance -->
            <div class="col-md-6">
              <div class="summary-item p-3 bg-light rounded">
                <div class="d-flex align-items-center">
                  <div class="icon-wrapper icon-gray me-3">
                      <i class="fas fa-wallet"></i>
                  </div>
                  <div>
                    <p class="mb-0 text-muted small">Total Balance</p>
                    <h4 class="mb-0 fw-bold text-dark">{{ formatCurrency(getTotalBalance, 'USD') }}</h4>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Total Equity -->
            <div class="col-md-6">
              <div class="summary-item p-3 bg-light rounded">
                <div class="d-flex align-items-center">
                  <div class="icon-wrapper icon-gray me-3">
                    <i class="fas fa-chart-line"></i>
                  </div>
                  <div>
                    <p class="mb-0 text-muted small">Total Equity</p>
                    <h4 class="mb-0 fw-bold text-dark">{{ formatCurrency(getTotalEquity, 'USD') }}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Refresh Button (Only show when not loading and no error) -->
      <div v-if="!loading && !errorMessage" class="mt-4 text-center">
        <button 
          class="btn btn-sm"
          style="background-color: #111111; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600;"
          @click="refreshData"
        >
          <i class="fas fa-sync-alt me-2"></i>
          Refresh Data
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  transition: all 0.3s ease;
}

/* Fixed height container to prevent jumping */
.content-container {
  min-height: 220px;
  position: relative;
}

/* Loading wrapper - centered */
.loading-wrapper {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Error wrapper - centered */
.error-wrapper {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* Summary content */
.summary-content {
  min-height: 220px;
}

.summary-item {
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.summary-item:hover {
  background-color: #e9ecef;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper i {
  font-size: 1.25rem;
}

@media (max-width: 576px) {
  h4 {
    font-size: 1.25rem;
  }
  
  .icon-wrapper {
    width: 36px;
    height: 36px;
  }
  
  .icon-wrapper i {
    font-size: 1rem;
  }
  
  .content-container,
  .loading-wrapper,
  .error-wrapper,
  .summary-content {
    min-height: 200px;
  }
}
</style>