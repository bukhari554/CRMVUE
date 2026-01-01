<script setup>
import { onMounted } from 'vue';
import { useTicketStats } from '@/utils/TicketStats.js';

const { loading, openTickets, fetchOpenTickets } = useTicketStats();

onMounted(() => {
  fetchOpenTickets();
});
</script>

<template>
  <div class="card border-0 shadow-sm h-100">
    <div class="card-body p-4">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h6 class="text-muted mb-2">Open Tickets</h6>
          <h2 class="mb-0 fw-bold" style="color: #344767">
            <span v-if="loading">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span v-else>{{ openTickets }}</span>
          </h2>
        </div>
        <div
          class="icon-shape"
          style="
            background: linear-gradient(310deg, #17c1e8 0%, #0d8ba8 100%);
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          "
        >
          <i class="fas fa-ticket-alt text-white" style="font-size: 1.25rem; line-height: 1;"></i>
        </div>
      </div>
    </div>
  </div>
</template>

