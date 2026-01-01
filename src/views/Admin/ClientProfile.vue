<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiGet, apiPost } from '@/utils/api.js';
import ArgonButton from '@/components/ArgonButton.vue';
import Table from '@/components/Table.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const client = ref(null);
const wallet = ref(null);
const summary = ref(null);
const tradingAccounts = ref([]);
const bankAccounts = ref([]);
const cryptoWallets = ref([]);
const recentTransactions = ref([]);

// Modal states
const showDepositModal = ref(false);
const showWithdrawalModal = ref(false);
const processing = ref(false);
const depositForm = ref({
  amount: ''
});
const withdrawalForm = ref({
  amount: ''
});

// Load client history
const loadClientHistory = async () => {
  loading.value = true;
  try {
    const clientId = route.params.id;
    const response = await apiGet(`/admin/clients/${clientId}/history`);
    
    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.data) {
        client.value = data.data.client || null;
        wallet.value = data.data.wallet || null;
        summary.value = data.data.summary || null;
        tradingAccounts.value = data.data.trading_accounts || [];
        bankAccounts.value = data.data.bank_accounts || [];
        cryptoWallets.value = data.data.crypto_wallets || [];
        recentTransactions.value = data.data.recent_transactions || [];
      }
    }
  } catch (err) {
    console.error('Error loading client history:', err);
  } finally {
    loading.value = false;
  }
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
    enabled: 'success',
    disabled: 'secondary',
  };
  return classes[status] || 'secondary';
};

// Get type badge class
const getTypeClass = (type) => {
  return type === 'deposit' ? 'success' : 'danger';
};

// Get KYC status badge class and text
const getKYCStatusInfo = (status) => {
  if (!status) return { class: 'secondary', text: 'Not Submitted' };
  
  const statusLower = status.toLowerCase();
  if (statusLower === 'not_submitted' || statusLower === 'not submitted') {
    return { class: 'secondary', text: 'Not Submitted' };
  } else if (statusLower === 'pending') {
    return { class: 'warning', text: 'Pending' };
  } else if (statusLower === 'approved' || statusLower === 'verified') {
    return { class: 'success', text: 'Verified' };
  } else if (statusLower === 'rejected') {
    return { class: 'danger', text: 'Not Verified' };
  }
  return { class: 'secondary', text: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) };
};

// Open deposit modal
const openDepositModal = () => {
  depositForm.value.amount = '';
  showDepositModal.value = true;
};

// Close deposit modal
const closeDepositModal = () => {
  showDepositModal.value = false;
  depositForm.value.amount = '';
};

// Submit deposit
const submitDeposit = async () => {
  if (!depositForm.value.amount || parseFloat(depositForm.value.amount) <= 0) {
    alert('Please enter a valid amount');
    return;
  }

  processing.value = true;
  try {
    const formData = new FormData();
    formData.append('user_id', client.value.id);
    formData.append('amount', depositForm.value.amount);

    const response = await apiPost('/admin/wallet/admin-deposit', formData);
    
    if (response.ok) {
      const data = await response.json();
      if (data?.success) {
        alert(data.message || 'Deposit added successfully');
        closeDepositModal();
        loadClientHistory(); // Reload to update wallet balance
      } else {
        alert(data.message || 'Failed to add deposit');
      }
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to add deposit');
    }
  } catch (err) {
    console.error('Error adding deposit:', err);
    alert('Failed to add deposit. Please try again.');
  } finally {
    processing.value = false;
  }
};

// Open withdrawal modal
const openWithdrawalModal = () => {
  withdrawalForm.value.amount = '';
  showWithdrawalModal.value = true;
};

// Close withdrawal modal
const closeWithdrawalModal = () => {
  showWithdrawalModal.value = false;
  withdrawalForm.value.amount = '';
};

// Submit withdrawal
const submitWithdrawal = async () => {
  if (!withdrawalForm.value.amount || parseFloat(withdrawalForm.value.amount) <= 0) {
    alert('Please enter a valid amount');
    return;
  }

  if (wallet.value && parseFloat(withdrawalForm.value.amount) > parseFloat(wallet.value.balance || 0)) {
    alert('Insufficient balance');
    return;
  }

  processing.value = true;
  try {
    const formData = new FormData();
    formData.append('user_id', client.value.id);
    formData.append('amount', withdrawalForm.value.amount);

    const response = await apiPost('/admin/wallet/admin-withdraw', formData);
    
    if (response.ok) {
      const data = await response.json();
      if (data?.success) {
        alert(data.message || 'Withdrawal added successfully');
        closeWithdrawalModal();
        loadClientHistory(); // Reload to update wallet balance
      } else {
        alert(data.message || 'Failed to add withdrawal');
      }
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to add withdrawal');
    }
  } catch (err) {
    console.error('Error adding withdrawal:', err);
    alert('Failed to add withdrawal. Please try again.');
  } finally {
    processing.value = false;
  }
};

// Table columns
const tradingAccountColumns = [
  { key: 'account_number', label: 'Account Number' },
  { key: 'platform', label: 'Platform' },
  { key: 'account_type', label: 'Account Type' },
  { key: 'leverage', label: 'Leverage' },
  { key: 'type', label: 'Type' },
  { key: 'balance', label: 'Balance' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created At' }
];

const bankAccountColumns = [
  { key: 'bank_name', label: 'Bank Name' },
  { key: 'iban', label: 'IBAN' },
  { key: 'swift_code', label: 'SWIFT Code' },
  { key: 'country', label: 'Country' },
  { key: 'beneficiary_name', label: 'Beneficiary Name' },
  { key: 'document', label: 'Document' },
  { key: 'created_at', label: 'Created At' }
];

const cryptoWalletColumns = [
  { key: 'crypto_currency', label: 'Currency' },
  { key: 'crypto_network', label: 'Network' },
  { key: 'wallet_address', label: 'Wallet Address' },
  { key: 'created_at', label: 'Created At' }
];

const transactionColumns = [
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'reference', label: 'Reference' },
  { key: 'description', label: 'Description' },
  { key: 'date', label: 'Date' }
];

onMounted(() => {
  loadClientHistory();
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
      <div class="flex-grow-1">
        <button
          class="btn btn-sm btn-outline-secondary mb-2"
          @click="router.push('/admin/clients')"
        >
          <i class="fas fa-arrow-left me-1"></i>
          <span class="d-none d-sm-inline">Back to Clients</span>
          <span class="d-sm-none">Back</span>
        </button>
        <h4 class="mb-0 text-dark fw-bold">
          <i class="fas fa-user me-2"></i>
          Client Profile
        </h4>
      </div>
      <div v-if="client" class="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
        <ArgonButton
          color="success"
          variant="gradient"
          size="sm"
          class="action-button"
          @click="openDepositModal"
        >
          <i class="fas fa-plus me-1"></i>
          <span class="d-none d-sm-inline">Add Deposit</span>
          <span class="d-sm-none">Deposit</span>
        </ArgonButton>
        <ArgonButton
          color="danger"
          variant="gradient"
          size="sm"
          class="action-button"
          @click="openWithdrawalModal"
        >
          <i class="fas fa-minus me-1"></i>
          <span class="d-none d-sm-inline">Add Withdrawal</span>
          <span class="d-sm-none">Withdrawal</span>
        </ArgonButton>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading client profile...</p>
    </div>

    <div v-else-if="client" class="row g-4">
      <!-- Client Information Card -->
      <div class="col-12 col-lg-6">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom">
            <h5 class="mb-0 fw-bold">Client Information</h5>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-12 col-sm-6">
                <strong>ID:</strong>
                <div>{{ client.id }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <strong>Name:</strong>
                <div>{{ client.name || '—' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <strong>Email:</strong>
                <div class="text-break">{{ client.email || '—' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <strong>Phone:</strong>
                <div>{{ client.telephone || '—' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <strong>Account Type:</strong>
                <div>{{ client.account_type ? client.account_type.charAt(0).toUpperCase() + client.account_type.slice(1) : '—' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <strong>Country:</strong>
                <div>{{ client.country || '—' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <strong>Currency:</strong>
                <div>{{ client.currency || '—' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <strong>KYC Status:</strong>
                <div>
                  <span :class="`badge bg-${getKYCStatusInfo(client.kyc_status).class} px-3 py-2`" style="font-size: 0.875rem;">
                    <i :class="`fas ${getKYCStatusInfo(client.kyc_status).class === 'success' ? 'fa-check-circle' : getKYCStatusInfo(client.kyc_status).class === 'danger' ? 'fa-times-circle' : 'fa-clock'} me-1`"></i>
                    {{ getKYCStatusInfo(client.kyc_status).text }}
                  </span>
                </div>
              </div>
              <div class="col-12">
                <strong>Created At:</strong>
                <div class="small">{{ formatDate(client.created_at) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wallet Information Card -->
      <div class="col-12 col-lg-6">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom">
            <h5 class="mb-0 fw-bold">Wallet Information</h5>
          </div>
          <div class="card-body">
            <div v-if="wallet" class="row g-3">
              <div class="col-12">
                <strong>Balance:</strong>
                <div class="h4 mb-0 text-primary">
                  {{ wallet.currency }} {{ parseFloat(wallet.balance || 0).toFixed(2) }}
                </div>
              </div>
              <div class="col-12">
                <strong>Currency:</strong>
                <div>{{ wallet.currency || '—' }}</div>
              </div>
            </div>
            <div v-else class="text-muted">
              No wallet information available.
            </div>
          </div>
        </div>
      </div>

      <!-- Trading Accounts Card -->
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom">
            <h5 class="mb-0 fw-bold">Trading Accounts</h5>
          </div>
          <div class="card-body">
            <Table
              :columns="tradingAccountColumns"
              :data="tradingAccounts"
              :loading="false"
              empty-text="No trading accounts found."
            >
              <template #cell-account_number="{ row }">
                <span class="fw-semibold font-monospace">{{ row.account_number || '—' }}</span>
              </template>

              <template #cell-platform="{ row }">
                <span class="badge bg-info">{{ row.platform || '—' }}</span>
              </template>

              <template #cell-account_type="{ row }">
                {{ row.account_type?.name || '—' }}
              </template>

              <template #cell-leverage="{ row }">
                <span class="badge bg-secondary">{{ row.leverage?.name || '—' }}</span>
              </template>

              <template #cell-type="{ row }">
                <span :class="`badge bg-${row.type === 'live' ? 'success' : 'warning'}`">
                  {{ row.type ? row.type.charAt(0).toUpperCase() + row.type.slice(1) : '—' }}
                </span>
              </template>

              <template #cell-balance="{ row }">
                <span class="fw-bold">
                  {{ row.currency }} {{ parseFloat(row.balance || 0).toFixed(2) }}
                </span>
              </template>

              <template #cell-status="{ row }">
                <span :class="`badge bg-${getStatusClass(row.status)}`">
                  {{ row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : '—' }}
                </span>
              </template>

              <template #cell-created_at="{ row }">
                <span class="small">{{ formatDate(row.created_at) }}</span>
              </template>
            </Table>
          </div>
        </div>
      </div>

      <!-- Bank Accounts Card -->
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom">
            <h5 class="mb-0 fw-bold">Bank Accounts</h5>
          </div>
          <div class="card-body">
            <Table
              :columns="bankAccountColumns"
              :data="bankAccounts"
              :loading="false"
              empty-text="No bank accounts found."
            >
              <template #cell-bank_name="{ row }">
                {{ row.bank_name || '—' }}
              </template>

              <template #cell-iban="{ row }">
                <span class="font-monospace">{{ row.iban || '—' }}</span>
              </template>

              <template #cell-swift_code="{ row }">
                <span class="font-monospace">{{ row.swift_code || '—' }}</span>
              </template>

              <template #cell-country="{ row }">
                {{ row.country || '—' }}
              </template>

              <template #cell-beneficiary_name="{ row }">
                {{ (row.beneficiary_first_name || '') + ' ' + (row.beneficiary_last_name || '') || '—' }}
              </template>

              <template #cell-document="{ row }">
                <a
                  v-if="row.document_url"
                  :href="row.document_url"
                  target="_blank"
                  class="btn btn-sm btn-outline-primary"
                >
                  <i class="fas fa-file me-1"></i>
                  View
                </a>
                <span v-else>—</span>
              </template>

              <template #cell-created_at="{ row }">
                <span class="small">{{ formatDate(row.created_at) }}</span>
              </template>
            </Table>
          </div>
        </div>
      </div>

      <!-- Crypto Wallets Card -->
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom">
            <h5 class="mb-0 fw-bold">Crypto Wallets</h5>
          </div>
          <div class="card-body">
            <Table
              :columns="cryptoWalletColumns"
              :data="cryptoWallets"
              :loading="false"
              empty-text="No crypto wallets found."
            >
              <template #cell-crypto_currency="{ row }">
                <span class="badge bg-info">{{ row.crypto_currency || '—' }}</span>
              </template>

              <template #cell-crypto_network="{ row }">
                <span class="badge bg-secondary">{{ row.crypto_network || '—' }}</span>
              </template>

              <template #cell-wallet_address="{ row }">
                <span class="font-monospace small">{{ row.wallet_address || '—' }}</span>
              </template>

              <template #cell-created_at="{ row }">
                <span class="small">{{ formatDate(row.created_at) }}</span>
              </template>
            </Table>
          </div>
        </div>
      </div>

      <!-- Recent Transactions Card -->
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom">
            <h5 class="mb-0 fw-bold">Recent Transactions</h5>
          </div>
          <div class="card-body">
            <Table
              v-if="recentTransactions.length > 0"
              :columns="transactionColumns"
              :data="recentTransactions"
              :loading="false"
              empty-text="No recent transactions found."
            >
              <template #cell-type="{ row }">
                <span :class="`badge bg-${getTypeClass(row.type)}`">
                  {{ row.type ? row.type.charAt(0).toUpperCase() + row.type.slice(1) : '—' }}
                </span>
              </template>

              <template #cell-amount="{ row }">
                <span class="fw-bold">
                  {{ row.currency }} {{ parseFloat(row.amount).toFixed(2) }}
                </span>
              </template>

              <template #cell-status="{ row }">
                <span :class="`badge bg-${getStatusClass(row.status)}`">
                  {{ row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : '—' }}
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
            <div v-else class="text-center text-muted py-5">
              No recent transactions found.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-5">
      <p class="text-muted">Client not found.</p>
      <button
        class="btn btn-primary"
        @click="router.push('/admin/clients')"
      >
        Back to Clients
      </button>
    </div>

    <!-- Deposit Modal -->
    <div
      v-if="showDepositModal"
      class="modal fade show d-block"
      style="background-color: rgba(0, 0, 0, 0.5);"
      tabindex="-1"
      @click.self="closeDepositModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-bottom">
            <h5 class="modal-title text-dark fw-bold">Add Deposit</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeDepositModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-semibold">Amount <span class="text-danger">*</span></label>
              <input
                v-model="depositForm.amount"
                type="number"
                step="0.01"
                min="0.01"
                class="form-control"
                placeholder="Enter amount"
                required
              />
            </div>
            <div v-if="wallet" class="alert alert-info mb-0">
              <strong>Current Balance:</strong> {{ wallet.currency }} {{ parseFloat(wallet.balance || 0).toFixed(2) }}
            </div>
          </div>
          <div class="modal-footer border-top">
            <ArgonButton
              color="secondary"
              variant="outline"
              size="sm"
              @click="closeDepositModal"
              :disabled="processing"
            >
              Cancel
            </ArgonButton>
            <ArgonButton
              color="success"
              variant="gradient"
              size="sm"
              @click="submitDeposit"
              :disabled="processing"
            >
              <i v-if="processing" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-plus me-1"></i>
              {{ processing ? 'Processing...' : 'Add Deposit' }}
            </ArgonButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Withdrawal Modal -->
    <div
      v-if="showWithdrawalModal"
      class="modal fade show d-block"
      style="background-color: rgba(0, 0, 0, 0.5);"
      tabindex="-1"
      @click.self="closeWithdrawalModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-bottom">
            <h5 class="modal-title text-dark fw-bold">Add Withdrawal</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeWithdrawalModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-semibold">Amount <span class="text-danger">*</span></label>
              <input
                v-model="withdrawalForm.amount"
                type="number"
                step="0.01"
                min="0.01"
                class="form-control"
                placeholder="Enter amount"
                required
              />
            </div>
            <div v-if="wallet" class="alert alert-info mb-0">
              <strong>Available Balance:</strong> {{ wallet.currency }} {{ parseFloat(wallet.balance || 0).toFixed(2) }}
            </div>
          </div>
          <div class="modal-footer border-top">
            <ArgonButton
              color="secondary"
              variant="outline"
              size="sm"
              @click="closeWithdrawalModal"
              :disabled="processing"
            >
              Cancel
            </ArgonButton>
            <ArgonButton
              color="danger"
              variant="gradient"
              size="sm"
              @click="submitWithdrawal"
              :disabled="processing"
            >
              <i v-if="processing" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-minus me-1"></i>
              {{ processing ? 'Processing...' : 'Add Withdrawal' }}
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

/* Mobile responsive styles */
@media (max-width: 767.98px) {
  .action-button {
    width: 100%;
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
  }
  
  .container-fluid {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  .card-header h5 {
    font-size: 1rem;
  }
  
  h4 {
    font-size: 1.25rem;
  }
}

@media (max-width: 575.98px) {
  .action-button {
    font-size: 0.8rem;
    padding: 0.4rem 0.75rem;
  }
  
  .btn-sm {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
  
  .modal-dialog {
    margin: 1rem;
    max-width: calc(100% - 2rem);
  }
  
  .modal-content {
    border-radius: 0.5rem;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .modal-title {
    font-size: 1.1rem;
  }
}

/* Ensure buttons stack properly on mobile */
@media (max-width: 575.98px) {
  .d-flex.flex-column.flex-sm-row {
    flex-direction: column !important;
  }
  
  .d-flex.flex-column.flex-sm-row .action-button {
    width: 100%;
  }
}
</style>
