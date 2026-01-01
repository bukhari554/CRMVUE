<script setup>
import { onMounted, computed, unref } from 'vue';
import { useWithdrawalStats } from '@/utils/WithdrawalStats.js';

const {
  loading,
  totalWithdrawalAmount,
  fetchTotalWithdrawalAmount
} = useWithdrawalStats();

const formattedTotal = computed(() => {
  const value = unref(totalWithdrawalAmount);
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
  });
});

onMounted(() => {
  fetchTotalWithdrawalAmount();
});
</script>

<template>
  <div class="card border-0 shadow-sm h-100">
    <div class="card-body p-4">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h6 class="text-muted mb-2">Total Approved Withdrawals</h6>
          <h2 class="mb-0 fw-bold" style="color: #344767">
            <span v-if="loading">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span v-else>
              $ {{ formattedTotal }}
            </span>
          </h2>
        </div>
        <div
          class="icon-shape"
          style="
            background: linear-gradient(310deg, #ea0606 0%, #c20505 100%);
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          "
        >
          <i class="fas fa-credit-card text-white" style="font-size: 1.25rem; line-height: 1;"></i>
        </div>
      </div>
    </div>
  </div>
</template>

