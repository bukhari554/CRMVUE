<script setup>
import { ref, onMounted, computed } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import Table from '@/components/Table.vue';
import { apiGet } from '@/utils/api.js';

const loadingTransactions = ref(false);
const transactions = ref([]);
const currentPage = ref(1);
const lastPage = ref(1);
const total = ref(0);
const filters = ref({
  type: '',
  status: '',
  per_page: 15,
});

// Load transactions
const loadTransactions = async (page = 1) => {
  loadingTransactions.value = true;
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: filters.value.per_page.toString(),
    });
    
    if (filters.value.type) {
      params.append('type', filters.value.type);
    }
    if (filters.value.status) {
      params.append('status', filters.value.status);
    }

    const response = await apiGet(`/client/wallet/transactions?${params.toString()}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.data?.transactions) {
        transactions.value = data.data.transactions.data || [];
        currentPage.value = data.data.transactions.current_page || 1;
        lastPage.value = data.data.transactions.last_page || 1;
        total.value = data.data.transactions.total || 0;
      }
    }
  } catch (err) {
    console.error('Error loading transactions:', err);
  } finally {
    loadingTransactions.value = false;
  }
};

// Apply filters
const applyFilters = () => {
  currentPage.value = 1;
  loadTransactions(1);
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

// Get status badge class
const getStatusClass = (status) => {
  const classes = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger',
    cancelled: 'secondary',
  };
  return classes[status] || 'secondary';
};

// Get type badge class
const getTypeClass = (type) => {
  const classes = {
    deposit: 'success',
    withdrawal: 'danger',
  };
  return classes[type] || 'secondary';
};

// Table columns configuration
const tableColumns = [
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'reference', label: 'Reference' },
  { key: 'description', label: 'Description' },
  { key: 'date', label: 'Date' }
];

// Pagination data for table component
const paginationData = computed(() => {
  if (lastPage.value <= 1) return null;
  return {
    currentPage: currentPage.value,
    lastPage: lastPage.value,
    total: total.value,
    perPage: 15,
    itemName: 'transactions'
  };
});

onMounted(() => {
  loadTransactions();
});
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 text-dark fw-bold">
        Transaction History
      </h5>
    </div>

    <!-- Filters -->
    <div class="card border p-3 mb-4">
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label text-sm fw-semibold">Type</label>
          <select v-model="filters.type" class="form-select form-select-sm">
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label text-sm fw-semibold">Status</label>
          <select v-model="filters.status" class="form-select form-select-sm">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div class="col-md-4 d-flex align-items-end">
          <ArgonButton
            color="success"
            variant="gradient"
            size="sm"
            @click="applyFilters"
            class="w-100"
          >
            <i class="fas fa-filter me-1"></i>
            Apply Filters
          </ArgonButton>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <Table
      :columns="tableColumns"
      :data="transactions"
      :loading="loadingTransactions"
      loading-text="Loading transactions..."
      empty-text="No transactions found."
      :pagination="paginationData"
      @page-change="loadTransactions"
    >
      <template #cell-type="{ row }">
        <span :class="`badge bg-${getTypeClass(row.type)}`">
          {{ row.type.charAt(0).toUpperCase() + row.type.slice(1) }}
        </span>
      </template>

      <template #cell-amount="{ row }">
        <span class="fw-bold">
          {{ row.currency }} {{ parseFloat(row.amount).toFixed(2) }}
        </span>
      </template>

      <template #cell-status="{ row }">
        <span :class="`badge bg-${getStatusClass(row.status)}`">
          {{ row.status.charAt(0).toUpperCase() + row.status.slice(1) }}
        </span>
      </template>

      <template #cell-reference="{ row }">
        <span class="font-monospace small">{{ row.reference || '—' }}</span>
      </template>

      <template #cell-description="{ row }">
        {{ row.description || '—' }}
      </template>

      <template #cell-date="{ row }">
        <span class="small">{{ formatDate(row.created_at) }}</span>
      </template>
    </Table>
  </div>
</template>

<style scoped>
.font-monospace { font-family: 'Courier New', monospace; }
</style>

