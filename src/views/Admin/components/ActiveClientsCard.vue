<script setup>
import { onMounted } from 'vue';
import { useClientStats } from '@/utils/ClientStats.js';

const { loading, activeClients, fetchActiveClients } = useClientStats();

onMounted(() => {
  fetchActiveClients();
});
</script>

<template>
  <div class="card border-0 shadow-sm h-100">
    <div class="card-body p-4">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h6 class="text-muted mb-2">Total Active Clients</h6>
          <h2 class="mb-0 fw-bold" style="color: #344767">
            <span v-if="loading">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span v-else>{{ activeClients }}</span>
          </h2>
        </div>
        <div
          class="icon-shape"
          style="
            background: linear-gradient(310deg, #cb0c9f 0%, #9b0a7a 100%);
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          "
        >
          <i class="fas fa-users text-white" style="font-size: 1.25rem; line-height: 1;"></i>
        </div>
      </div>
    </div>
  </div>
</template>

