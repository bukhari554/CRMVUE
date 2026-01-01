<script setup>
import { ref, onMounted, computed } from 'vue';
import { apiGet, apiPatch } from '@/utils/api.js';
import ArgonButton from '@/components/ArgonButton.vue';
import Table from '@/components/Table.vue';

const loadingWithdrawals = ref(false);
const withdrawals = ref([]);
const currentPage = ref(1);
const lastPage = ref(1);
const total = ref(0);
const filters = ref({
  user_id: '',
  status: 'pending',
  per_page: 15,
});
const showRejectModal = ref(false);
const selectedTransaction = ref(null);
const rejectReason = ref('');
const processing = ref(false);
const showAccountDetailsModal = ref(false);
const selectedWithdrawalForDetails = ref(null);

// Load withdrawals
const loadWithdrawals = async (page = 1) => {
  loadingWithdrawals.value = true;
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: filters.value.per_page.toString(),
    });
    
    if (filters.value.user_id) {
      params.append('user_id', filters.value.user_id);
    }
    if (filters.value.status) {
      params.append('status', filters.value.status);
    }

    const response = await apiGet(`/admin/wallet/withdrawals?${params.toString()}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.data?.withdrawals) {
        withdrawals.value = data.data.withdrawals.data || [];
        currentPage.value = data.data.withdrawals.current_page || 1;
        lastPage.value = data.data.withdrawals.last_page || 1;
        total.value = data.data.withdrawals.total || 0;
      }
    }
  } catch (err) {
    console.error('Error loading withdrawals:', err);
  } finally {
    loadingWithdrawals.value = false;
  }
};

// Approve transaction
const approveTransaction = async (transactionId) => {
  if (!confirm('Are you sure you want to approve this withdrawal?')) {
    return;
  }

  processing.value = true;
  try {
    const response = await apiPatch(`/admin/wallet/transactions/${transactionId}/approve`);
    
    if (response.ok) {
      const data = await response.json();
      if (data?.success) {
        alert(data.message || 'Transaction approved successfully');
        loadWithdrawals(currentPage.value);
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

// Open reject modal
const openRejectModal = (transaction) => {
  selectedTransaction.value = transaction;
  rejectReason.value = '';
  showRejectModal.value = true;
};

// Close reject modal
const closeRejectModal = () => {
  showRejectModal.value = false;
  selectedTransaction.value = null;
  rejectReason.value = '';
};

// Reject transaction
const rejectTransaction = async () => {
  if (!selectedTransaction.value) return;

  processing.value = true;
  try {
    const response = await apiPatch(`/admin/wallet/transactions/${selectedTransaction.value.id}/reject`, {
      reason: rejectReason.value || undefined,
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data?.success) {
        alert(data.message || 'Transaction rejected successfully');
        closeRejectModal();
        loadWithdrawals(currentPage.value);
      }
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to reject transaction');
    }
  } catch (err) {
    console.error('Error rejecting transaction:', err);
    alert('Failed to reject transaction. Please try again.');
  } finally {
    processing.value = false;
  }
};

// Show account details modal
const showAccountDetails = (withdrawal) => {
  selectedWithdrawalForDetails.value = withdrawal;
  showAccountDetailsModal.value = true;
};

// Close account details modal
const closeAccountDetailsModal = () => {
  showAccountDetailsModal.value = false;
  selectedWithdrawalForDetails.value = null;
};

// Apply filters
const applyFilters = () => {
  currentPage.value = 1;
  loadWithdrawals(1);
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

// Table columns configuration
const tableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'user', label: 'User' },
  { key: 'amount', label: 'Amount' },
  { key: 'payment_type', label: 'Payment Type' },
  { key: 'status', label: 'Status' },
  { key: 'reference', label: 'Reference' },
  { key: 'description', label: 'Description' },
  { key: 'date', label: 'Date' },
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
    itemName: 'withdrawals'
  };
});

onMounted(() => {
  loadWithdrawals();
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="mb-0 text-dark fw-bold">
            <i class="fas fa-credit-card me-2"></i>
            Withdrawal Management
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

        <!-- Withdrawals Table -->
        <Table
          :columns="tableColumns"
          :data="withdrawals"
          :loading="loadingWithdrawals"
          loading-text="Loading withdrawals..."
          empty-text="No withdrawals found."
          :pagination="paginationData"
          @page-change="loadWithdrawals"
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
            <span :class="`badge bg-${row.metadata?.payment_type === 'Bank transfer' ? 'primary' : 'info'}`">
              {{ row.metadata?.payment_type || '—' }}
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
              <ArgonButton
                color="info"
                variant="outline"
                size="sm"
                @click="showAccountDetails(row)"
              >
                <i class="fas fa-info-circle me-1"></i>
                Details
              </ArgonButton>
            </div>
          </template>
        </Table>

        <!-- Account Details Modal -->
        <div
          v-if="showAccountDetailsModal"
          class="modal fade show d-block"
          style="background-color: rgba(0, 0, 0, 0.5);"
          tabindex="-1"
          @click.self="closeAccountDetailsModal"
        >
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
              <div class="modal-header border-bottom">
                <h5 class="modal-title text-dark fw-bold">Account Details</h5>
                <button
                  type="button"
                  class="btn-close"
                  @click="closeAccountDetailsModal"
                  aria-label="Close"
                ></button>
              </div>
              <div class="modal-body">
                <div v-if="selectedWithdrawalForDetails && selectedWithdrawalForDetails.metadata">
                  <div v-if="selectedWithdrawalForDetails.metadata.payment_type === 'Bank transfer' && selectedWithdrawalForDetails.metadata.bank_account" class="row g-3">
                    <div class="col-md-6">
                      <strong>Bank Name:</strong> {{ selectedWithdrawalForDetails.metadata.bank_account.bank_name || '—' }}
                    </div>
                    <div class="col-md-6">
                      <strong>IBAN:</strong> {{ selectedWithdrawalForDetails.metadata.bank_account.iban || '—' }}
                    </div>
                    <div class="col-md-6">
                      <strong>SWIFT Code:</strong> {{ selectedWithdrawalForDetails.metadata.bank_account.swift_code || '—' }}
                    </div>
                    <div class="col-md-6">
                      <strong>Beneficiary:</strong> {{ selectedWithdrawalForDetails.metadata.bank_account.beneficiary_first_name }} {{ selectedWithdrawalForDetails.metadata.bank_account.beneficiary_last_name }}
                    </div>
                    <div class="col-12">
                      <strong>Bank Address:</strong> {{ selectedWithdrawalForDetails.metadata.bank_account.bank_address || '—' }}
                    </div>
                  </div>
                  <div v-else-if="selectedWithdrawalForDetails.metadata.payment_type === 'Crypto transfer' && selectedWithdrawalForDetails.metadata.crypto_wallet" class="row g-3">
                    <div class="col-md-6">
                      <strong>Currency:</strong> {{ selectedWithdrawalForDetails.metadata.crypto_wallet.crypto_currency || '—' }}
                    </div>
                    <div class="col-md-6">
                      <strong>Network:</strong> {{ selectedWithdrawalForDetails.metadata.crypto_wallet.crypto_network || '—' }}
                    </div>
                    <div class="col-12">
                      <strong>Wallet Address:</strong> 
                      <span class="font-monospace">{{ selectedWithdrawalForDetails.metadata.crypto_wallet.wallet_address || '—' }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center text-muted py-3">
                  No account details available.
                </div>
              </div>
              <div class="modal-footer border-top">
                <ArgonButton
                  color="secondary"
                  variant="outline"
                  size="sm"
                  @click="closeAccountDetailsModal"
                >
                  Close
                </ArgonButton>
              </div>
            </div>
          </div>
        </div>
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
            <h5 class="modal-title text-dark fw-bold">Reject Withdrawal</h5>
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
              {{ processing ? 'Rejecting...' : 'Reject Withdrawal' }}
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
