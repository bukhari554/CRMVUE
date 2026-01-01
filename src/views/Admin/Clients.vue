<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { apiGet } from '@/utils/api.js';
import ArgonButton from '@/components/ArgonButton.vue';
import Table from '@/components/Table.vue';

const router = useRouter();
const loadingClients = ref(false);
const clients = ref([]);
const currentPage = ref(1);
const lastPage = ref(1);
const total = ref(0);

// Load clients
const loadClients = async (page = 1) => {
  loadingClients.value = true;
  try {
    const params = new URLSearchParams({
      page: page.toString(),
    });

    const response = await apiGet(`/admin/clients?${params.toString()}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.data?.clients) {
        clients.value = data.data.clients.data || [];
        currentPage.value = data.data.clients.current_page || 1;
        lastPage.value = data.data.clients.last_page || 1;
        total.value = data.data.clients.total || 0;
      }
    }
  } catch (err) {
    console.error('Error loading clients:', err);
  } finally {
    loadingClients.value = false;
  }
};

// View user profile
const viewUserProfile = (clientId) => {
  router.push(`/admin/clients/${clientId}/profile`);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return '—';
  }
};

// Get KYC status badge class
const getKYCStatusClass = (status) => {
  const classes = {
    not_submitted: 'secondary',
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return classes[status] || 'secondary';
};

// Table columns configuration
const tableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'kyc_status', label: 'KYC Status' },
  { key: 'created_at', label: 'Created At' },
  { key: 'actions', label: 'Actions' }
];

// Pagination data for table component
const paginationData = computed(() => {
  if (lastPage.value <= 1) return null;
  return {
    currentPage: currentPage.value,
    lastPage: lastPage.value,
    total: total.value,
    perPage: 15,
    itemName: 'clients'
  };
});

onMounted(() => {
  loadClients();
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="mb-0 text-dark fw-bold">
            <i class="fas fa-users me-2"></i>
            Clients Management
          </h4>
        </div>

        <!-- Clients Table -->
        <Table
          :columns="tableColumns"
          :data="clients"
          :loading="loadingClients"
          loading-text="Loading clients..."
          empty-text="No clients found."
          :pagination="paginationData"
          @page-change="loadClients"
        >
          <template #cell-id="{ row }">
            {{ row.id }}
          </template>

          <template #cell-name="{ row }">
            <span class="fw-semibold">{{ row.name || '—' }}</span>
          </template>

          <template #cell-email="{ row }">
            {{ row.email || '—' }}
          </template>

          <template #cell-phone="{ row }">
            {{ row.phone || '—' }}
          </template>

          <template #cell-kyc_status="{ row }">
            <span :class="`badge bg-${getKYCStatusClass(row.kyc_status)}`">
              {{ row.kyc_status ? row.kyc_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '—' }}
            </span>
          </template>

          <template #cell-created_at="{ row }">
            <span class="small">{{ formatDate(row.created_at) }}</span>
          </template>

          <template #cell-actions="{ row }">
            <ArgonButton
              color="dark"
              variant="gradient"
              size="sm"
              @click="viewUserProfile(row.id)"
            >
              <i class="fas fa-user me-1"></i>
              View User Profile
            </ArgonButton>
          </template>
        </Table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-monospace { font-family: 'Courier New', monospace; }
</style>
