<script setup>
import { ref, onMounted } from 'vue';
import { apiGet } from '@/utils/api.js';
import { useKycStats } from '@/utils/KYCStats.js';

const loading = ref(false);
const usersWithoutKYC = ref(0);
const { totalKycRequests, fetchTotalKyc } = useKycStats();
const totalClients = ref(0);

const fetchUsersWithoutKYC = async () => {
  loading.value = true;
  try {
    // Fetch total clients
    const clientsResponse = await apiGet('/admin/clients?per_page=1');
    if (clientsResponse.ok) {
      const clientsData = await clientsResponse.json();
      if (clientsData?.success && clientsData?.data?.clients) {
        totalClients.value = clientsData.data.clients.total || 0;
      }
    }

    // Fetch total KYC requests
    await fetchTotalKyc();

    // Users without KYC = Total clients - Total KYC requests
    usersWithoutKYC.value = Math.max(0, totalClients.value - totalKycRequests.value);
  } catch (err) {
    console.error('Error fetching users without KYC:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUsersWithoutKYC();
});
</script>

<template>
  <div class="card border-0 shadow-sm h-100">
    <div class="card-body p-4">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h6 class="text-muted mb-2">Users Without KYC</h6>
          <h2 class="mb-0 fw-bold" style="color: #344767">
            <span v-if="loading">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span v-else>{{ usersWithoutKYC }}</span>
          </h2>
        </div>
        <div
          class="icon-shape"
          style="
            background: linear-gradient(310deg, #f53939 0%, #c41e1e 100%);
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          "
        >
          <i class="fas fa-user-times text-white" style="font-size: 1.25rem; line-height: 1;"></i>
        </div>
      </div>
    </div>
  </div>
</template>

