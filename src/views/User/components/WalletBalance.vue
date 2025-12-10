<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const balance = ref(0);
const loading = ref(false);
let intervalId = null;


const fetchBalance = async () => {
  loading.value = true;
  
  try {
    const response = await fetch('/api/wallet/balance', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Balance fetch failed');
    }

    const data = await response.json();
    balance.value = data.balance || 0;
  } catch (error) {
    console.error('Error fetching balance:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchBalance();
  
  intervalId = setInterval(fetchBalance, 30000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<template>
  <div class="wallet-display">
    <div class="wallet-icon-wrapper">
      <svg 
        class="wallet-icon" 
        viewBox="0 0 512 512" 
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M461.2 128H80c-8.84 0-16-7.16-16-16s7.16-16 16-16h384c8.84 0 16-7.16 16-16 0-26.51-21.49-48-48-48H64C28.65 32 0 60.65 0 96v320c0 35.35 28.65 64 64 64h397.2c28.02 0 50.8-21.53 50.8-48V176c0-26.47-22.78-48-50.8-48zM416 336c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32z"/>
      </svg>
    </div>
    <span class="balance-text">
      $ {{ loading ? '...' : balance.toFixed(2) }}
    </span>
  </div>
</template>

<style scoped>
.wallet-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #e5e5e5;
  color: #374151;
  font-weight: 600;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.wallet-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 50%;
  padding: 0.4rem;
  width: 2rem;
  height: 2rem;
}

.wallet-icon {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
}

.balance-text {
  font-size: 1rem;
  color: #374151;
}
</style>