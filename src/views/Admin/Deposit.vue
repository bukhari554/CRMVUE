<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { apiPatch } from '@/utils/api.js';
import { useDepositStats } from '@/utils/DepositStats.js';

import ArgonButton from '@/components/ArgonButton.vue';
import Table from '@/components/Table.vue';

/* ===============================
   STATE
================================ */
const deposits = ref([]);
const currentPage = ref(1);
const lastPage = ref(1);
const total = ref(0);

const filters = ref({
  user_id: '',
  status: '', // ALL by default
  per_page: 15,
});

const showRejectModal = ref(false);
const selectedTransaction = ref(null);
const rejectReason = ref('');
const processing = ref(false);

/* ===============================
   COMPOSABLE
================================ */
const {
  loading: loadingDeposits,
  fetchDeposits,
  fetchTotalDeposits,
  fetchCompletedDeposits,
  fetchPendingDeposits,
  fetchFailedDeposits,
  fetchCancelledDeposits,
  resetCache, // ✅ Added
} = useDepositStats();

const loadDeposits = async (page = 1) => {
  const result = await fetchDeposits(page, filters.value);

  if (result?.success) {
    deposits.value = result.deposits;
    currentPage.value = result.currentPage;
    lastPage.value = result.lastPage;
    total.value = result.total;
  }
};

watch(
  () => [filters.value.status, filters.value.user_id],
  () => {
    currentPage.value = 1;
    loadDeposits(1);
  }
);

// Approve transaction
const approveTransaction = async (transactionId) => {
  if (!confirm('Are you sure you want to approve this deposit?')) {
    return;
  }

  processing.value = true;
  try {
    const response = await apiPatch(`/admin/wallet/transactions/${transactionId}/approve`);
    
    if (response.ok) {
      const data = await response.json();
      if (data?.success) {
        alert(data.message || 'Transaction approved successfully');
        
        // Reset cache and refresh
        resetCache();
        await loadDeposits(currentPage.value);
        await fetchTotalDeposits(true); // force refresh
        await fetchCompletedDeposits(true);
        await fetchPendingDeposits(true);
      }
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to approve transaction');
    }
  } catch (err) {
    console.error('Error approving transaction:', err);
    alert('Failed to approve transaction. Please try again.');
  } finally {
    processing.value = false;
  }
};

const openRejectModal = (row) => {
  selectedTransaction.value = row;
  rejectReason.value = '';
  showRejectModal.value = true;
};

const closeRejectModal = () => {
  showRejectModal.value = false;
  selectedTransaction.value = null;
};

const rejectTransaction = async () => {
  if (!selectedTransaction.value) return;

  processing.value = true;
  try {
    const res = await apiPatch(
      `/admin/wallet/transactions/${selectedTransaction.value.id}/reject`,
      { reason: rejectReason.value || undefined }
    );

    const data = await res.json();
    if (res.ok && data?.success) {
      alert(data.message || 'Rejected');
      closeRejectModal();
      
      // Reset cache and refresh
      resetCache();
      await loadDeposits(currentPage.value);
      await fetchTotalDeposits(true);
      await fetchPendingDeposits(true);
      await fetchFailedDeposits(true);
    } else {
      alert(data.message || 'Reject failed');
    }
  } catch (e) {
    console.error('Reject error:', e);
    alert('Reject error');
  } finally {
    processing.value = false;
  }
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleString('en-US') : '—';

const getStatusClass = (s) =>
  ({ pending: 'warning', completed: 'success', failed: 'danger', cancelled: 'secondary' }[s] || 'secondary');

const getPaymentTypeClass = (t) =>
  t === 'card' ? 'primary' : 'info';

const tableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'user', label: 'User' },
  { key: 'amount', label: 'Amount' },
  { key: 'payment_type', label: 'Payment Type' },
  { key: 'status', label: 'Status' },
  { key: 'reference', label: 'Reference' },
  { key: 'description', label: 'Description' },
  { key: 'screenshot', label: 'Screenshot' },
  { key: 'date', label: 'Date' },
  { key: 'actions', label: 'Actions' },
];

const paginationData = computed(() =>
  lastPage.value > 1
    ? {
        currentPage: currentPage.value,
        lastPage: lastPage.value,
        total: total.value,
        perPage: 15,
        itemName: 'deposits',
      }
    : null
);

onMounted(() => {
  loadDeposits();
  fetchTotalDeposits();
  fetchCompletedDeposits();
  fetchPendingDeposits();
  fetchFailedDeposits();
  fetchCancelledDeposits();
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="mb-0 text-dark fw-bold">
            <i class="fas fa-money-bill-wave me-2"></i>
            Deposit Management
          </h4>
        </div>

        <!-- Filters -->
        <div class="card border p-3 mb-4">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label text-sm fw-semibold">User ID</label>
              <input
                v-model="filters.user_id"
                type="number"
                class="form-control form-control-sm"
                placeholder="Filter by user ID"
              />
            </div>
            <div class="col-md-4">
              <label class="form-label text-sm fw-semibold">Status</label>
              <select v-model="filters.status" class="form-select form-select-sm">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <ArgonButton
                color="dark"
                variant="gradient"
                size="sm"
                @click="loadDeposits(1)"
                class="w-100"
              >
                <i class="fas fa-filter me-1"></i>
                Apply Filters
              </ArgonButton>
            </div>
          </div>
        </div>

        <!-- Deposits Table -->
        <Table
          :columns="tableColumns"
          :data="deposits"
          :loading="loadingDeposits"
          loading-text="Loading deposits..."
          empty-text="No deposits found."
          :pagination="paginationData"
          @page-change="loadDeposits"
        >
          <template #cell-id="{ row }">
            {{ row.id }}
          </template>

          <template #cell-user="{ row }">
            <div v-if="row.user">
              <div class="fw-semibold">{{ row.user.name || row.user.email }}</div>
              <small class="text-muted">{{ row.user.email }}</small>
            </div>
            <span v-else>—</span>
          </template>

          <template #cell-amount="{ row }">
            <span class="fw-bold">
              {{ row.currency }} {{ parseFloat(row.amount).toFixed(2) }}
            </span>
          </template>

          <template #cell-payment_type="{ row }">
            <span :class="`badge bg-${getPaymentTypeClass(row.metadata?.payment_method?.type)}`">
              {{ row.metadata?.payment_method?.type === 'card' ? 'Card' : (row.metadata?.payment_method?.payment_method_name || 'Crypto') }}
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

          <template #cell-screenshot="{ row }">
           <a 
              v-if="row.screenshot_path"
              :href="row.screenshot_path"
              target="_blank"
              class="btn btn-sm btn-outline-primary"
            >
              <i class="fas fa-image me-1"></i>
              View
            </a>
            <span v-else>—</span>
          </template>

          <template #cell-date="{ row }">
            <span class="small">{{ formatDate(row.created_at) }}</span>
          </template>

          <template #cell-actions="{ row }">
            <div class="btn-group" role="group">
              <ArgonButton
                v-if="row.status === 'pending'"
                color="success"
                variant="gradient"
                size="sm"
                @click="approveTransaction(row.id)"
                :disabled="processing"
              >
                <i class="fas fa-check me-1"></i>
                Approve
              </ArgonButton>
              <ArgonButton
                v-if="row.status === 'pending'"
                color="danger"
                variant="outline"
                size="sm"
                @click="openRejectModal(row)"
                :disabled="processing"
              >
                <i class="fas fa-times me-1"></i>
                Reject
              </ArgonButton>
            </div>
          </template>
        </Table>
      </div>
    </div>

    <!-- Reject Modal -->
    <div
      v-if="showRejectModal"
      class="modal fade show d-block"
      style="background-color: rgba(0, 0, 0, 0.5);"
      tabindex="-1"
      @click.self="closeRejectModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-bottom">
            <h5 class="modal-title text-dark fw-bold">Reject Deposit</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeRejectModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-semibold">Rejection Reason (Optional)</label>
              <textarea
                v-model="rejectReason"
                class="form-control"
                rows="3"
                placeholder="Enter reason for rejection"
                maxlength="500"
              ></textarea>
              <small class="text-muted">{{ rejectReason.length }}/500 characters</small>
            </div>
          </div>
          <div class="modal-footer border-top">
            <ArgonButton
              color="secondary"
              variant="outline"
              size="sm"
              @click="closeRejectModal"
              :disabled="processing"
            >
              Cancel
            </ArgonButton>
            <ArgonButton
              color="danger"
              variant="gradient"
              size="sm"
              @click="rejectTransaction"
              :disabled="processing"
            >
              <i v-if="processing" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-times me-1"></i>
              {{ processing ? 'Rejecting...' : 'Reject Deposit' }}
            </ArgonButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-monospace { font-family: 'Courier New', monospace; }
.modal { display: block; }
</style>