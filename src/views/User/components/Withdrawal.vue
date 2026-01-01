<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import ArgonInput from '@/components/ArgonInput.vue';
import Table from '@/components/Table.vue';
import { apiGet, apiPost } from '@/utils/api.js';

const loadingWithdrawals = ref(false);
const submitting = ref(false);
const validationErrors = ref({});
const walletBalance = ref(null);
const walletCurrency = ref('USD');
const bankAccounts = ref([]);
const cryptoWallets = ref([]);
const loadingAccounts = ref(false);
const withdrawals = ref([]);
const currentPage = ref(1);
const lastPage = ref(1);
const total = ref(0);
const showAddModal = ref(false);

const formData = ref({
  amount: '',
  currency: 'USD',
  payment_type: 'Bank transfer',
  account_id: '',
  description: '',
});

// Load wallet balance
const loadWalletBalance = async () => {
  try {
    const response = await apiGet('/client/wallet/balance');
    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.data?.wallet) {
        walletBalance.value = parseFloat(data.data.wallet.balance);
        walletCurrency.value = data.data.wallet.currency || 'USD';
        formData.value.currency = walletCurrency.value;
      }
    }
  } catch (err) {
    console.error('Error loading wallet balance:', err);
  }
};

// Load withdrawal transactions
const loadWithdrawals = async (page = 1) => {
  loadingWithdrawals.value = true;
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: '15',
      type: 'withdrawal',
    });

    const response = await apiGet(`/client/wallet/transactions?${params.toString()}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.data?.transactions) {
        withdrawals.value = data.data.transactions.data || [];
        currentPage.value = data.data.transactions.current_page || 1;
        lastPage.value = data.data.transactions.last_page || 1;
        total.value = data.data.transactions.total || 0;
      }
    }
  } catch (err) {
    console.error('Error loading withdrawals:', err);
  } finally {
    loadingWithdrawals.value = false;
  }
};

// Load bank accounts
const loadBankAccounts = async () => {
  try {
    const response = await apiGet('/client/bank-accounts');
    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.data?.bank_accounts) {
        bankAccounts.value = data.data.bank_accounts;
      } else if (Array.isArray(data.data)) {
        bankAccounts.value = data.data;
      }
    }
  } catch (err) {
    console.error('Error loading bank accounts:', err);
  }
};

// Load crypto wallets
const loadCryptoWallets = async () => {
  try {
    const response = await apiGet('/client/crypto-wallets');
    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.data?.crypto_wallets) {
        cryptoWallets.value = data.data.crypto_wallets;
      } else if (Array.isArray(data.data)) {
        cryptoWallets.value = data.data;
      }
    }
  } catch (err) {
    console.error('Error loading crypto wallets:', err);
  }
};

// Load all accounts
const loadAccounts = async () => {
  loadingAccounts.value = true;
  await Promise.all([loadBankAccounts(), loadCryptoWallets()]);
  loadingAccounts.value = false;
};

// Watch payment type change
watch(() => formData.value.payment_type, () => {
  formData.value.account_id = '';
});

// Submit withdrawal request
const submitWithdrawal = async () => {
  if (!formData.value.amount || parseFloat(formData.value.amount) < 0.01) {
    alert('Please enter a valid amount (minimum 0.01)');
    return;
  }

  if (!formData.value.account_id) {
    alert('Please select an account');
    return;
  }

  if (walletBalance.value !== null && parseFloat(formData.value.amount) > walletBalance.value) {
    alert(`Insufficient balance. Available balance: ${walletCurrency.value} ${walletBalance.value.toFixed(2)}`);
    return;
  }

  submitting.value = true;
  validationErrors.value = {};
  
  try {
    const response = await apiPost('/client/wallet/withdraw', {
      amount: parseFloat(formData.value.amount),
      currency: 'USD',
      payment_type: formData.value.payment_type,
      account_id: parseInt(formData.value.account_id),
      description: formData.value.description || undefined,
    });
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('API endpoint not found.');
    }
    
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 422) {
        if (data.errors) {
          validationErrors.value = data.errors;
          const firstError = Object.values(data.errors)[0];
          alert(Array.isArray(firstError) ? firstError[0] : firstError);
        } else if (data.message) {
          alert(data.message);
        }
        return;
      }
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    if (data && (data.success || data.message)) {
      alert(data.message || 'Withdrawal request submitted successfully!');
      closeAddModal();
      resetForm();
      loadWalletBalance();
      loadWithdrawals(currentPage.value);
    }

  } catch (err) {
    console.error('Error submitting withdrawal:', err);
    alert(err.message || 'Failed to submit withdrawal request. Please try again.');
  } finally {
    submitting.value = false;
  }
};

// Reset form
const resetForm = () => {
  formData.value = {
    amount: '',
    currency: 'USD',
    payment_type: 'Bank transfer',
    account_id: '',
    description: '',
  };
  validationErrors.value = {};
};

const hasError = (field) => {
  return validationErrors.value[field] && validationErrors.value[field].length > 0;
};

const getError = (field) => {
  if (hasError(field)) {
    return Array.isArray(validationErrors.value[field]) 
      ? validationErrors.value[field][0] 
      : validationErrors.value[field];
  }
  return '';
};

const getAccountDisplay = (account) => {
  if (formData.value.payment_type === 'Bank transfer') {
    return `${account.bank_name || 'N/A'} - ${account.iban || 'N/A'}`;
  } else {
    return `${account.crypto_currency} (${account.crypto_network}) - ${account.wallet_address.substring(0, 10)}...`;
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
  };
  return classes[status] || 'secondary';
};

// Open add modal
const openAddModal = () => {
  resetForm();
  loadAccounts();
  showAddModal.value = true;
};

// Close add modal
const closeAddModal = () => {
  showAddModal.value = false;
  resetForm();
};

// Table columns configuration
const tableColumns = [
  { key: 'payment_type', label: 'Payment Type' },
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
    itemName: 'withdrawals'
  };
});

onMounted(() => {
  loadWalletBalance();
  loadAccounts();
  loadWithdrawals();
});
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 text-dark fw-bold">
        Withdrawal History
      </h5>
      <ArgonButton
        color="success"
        variant="gradient"
        size="sm"
        @click="openAddModal"
      >
        <i class="fas fa-plus me-1"></i>
        Add Withdrawal
      </ArgonButton>
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
      <template #cell-payment_type="{ row }">
        <span :class="`badge bg-${row.metadata?.payment_type === 'Bank transfer' ? 'primary' : 'info'}`">
          {{ row.metadata?.payment_type || '—' }}
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

    <!-- Add Withdrawal Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAddModal"
          class="modal-overlay"
          @click.self="closeAddModal"
        >
          <div class="modal-container" @click.stop>
            <button class="modal-close" @click="closeAddModal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div class="modal-header-content">
              <h5 class="modal-title text-dark fw-bold">
                <i class="fas fa-arrow-up me-2"></i>
                Add Withdrawal
              </h5>
            </div>
            <div class="modal-body-content">
            <div class="card border p-4">
      <form @submit.prevent="submitWithdrawal">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label text-sm fw-semibold">Amount *</label>
            <ArgonInput
              v-model="formData.amount"
              type="number"
              step="0.01"
              min="0.01"
              :max="walletBalance"
              placeholder="Enter amount"
              :class="{ 'is-invalid': hasError('amount') }"
              required
            />
            <small class="text-muted">Minimum: 0.01</small>
            <div v-if="hasError('amount')" class="invalid-feedback d-block">
              {{ getError('amount') }}
            </div>
          </div>


          <div class="col-12">
            <label class="form-label text-sm fw-semibold">Payment Type *</label>
            <select
              v-model="formData.payment_type"
              class="form-select"
              :class="{ 'is-invalid': hasError('payment_type') }"
              required
            >
              <option value="Bank transfer">Bank Transfer</option>
              <option value="Crypto transfer">Crypto Transfer</option>
            </select>
            <div v-if="hasError('payment_type')" class="invalid-feedback d-block">
              {{ getError('payment_type') }}
            </div>
          </div>

          <div class="col-12">
            <label class="form-label text-sm fw-semibold">
              {{ formData.payment_type === 'Bank transfer' ? 'Bank Account' : 'Crypto Wallet' }} *
            </label>
            <select
              v-model="formData.account_id"
              class="form-select"
              :class="{ 'is-invalid': hasError('account_id') }"
              :disabled="loadingAccounts"
              required
            >
              <option value="">Select {{ formData.payment_type === 'Bank transfer' ? 'Bank Account' : 'Crypto Wallet' }}</option>
              <option
                v-for="account in (formData.payment_type === 'Bank transfer' ? bankAccounts : cryptoWallets)"
                :key="account.id"
                :value="account.id"
              >
                {{ getAccountDisplay(account) }}
              </option>
            </select>
            <div v-if="hasError('account_id')" class="invalid-feedback d-block">
              {{ getError('account_id') }}
            </div>
            <small v-if="formData.payment_type === 'Bank transfer' && bankAccounts.length === 0" class="text-danger">
              No bank accounts found. Please add a bank account first.
            </small>
            <small v-if="formData.payment_type === 'Crypto transfer' && cryptoWallets.length === 0" class="text-danger">
              No crypto wallets found. Please add a crypto wallet first.
            </small>
          </div>

          <div class="col-12">
            <label class="form-label text-sm fw-semibold">Description</label>
            <textarea
              v-model="formData.description"
              class="form-control"
              rows="3"
              placeholder="Optional description (max 500 characters)"
              maxlength="500"
            ></textarea>
            <small class="text-muted">{{ formData.description.length }}/500 characters</small>
          </div>

          <div class="col-12">
            <div class="alert alert-warning mb-0">
              <i class="fas fa-info-circle me-2"></i>
              Your withdrawal request will be reviewed by an administrator. The funds will be transferred once approved.
            </div>
          </div>

          <div class="col-12">
            <ArgonButton
              color="success"
              variant="gradient"
              size="md"
              type="submit"
              :disabled="submitting || loadingAccounts"
              class="w-100"
            >
              <i v-if="submitting" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-paper-plane me-1"></i>
              {{ submitting ? 'Submitting...' : 'Submit Withdrawal Request' }}
            </ArgonButton>
          </div>
        </div>
      </form>
            </div>
          </div>
        </div>
      </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.form-label { margin-bottom: 0.5rem; color: #344767; }
.form-select, .form-control {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d2d6da;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}
.is-invalid { border-color: #dc3545 !important; }
.invalid-feedback { color: #dc3545; font-size: 0.75rem; margin-top: 0.25rem; }
.font-monospace { font-family: 'Courier New', monospace; }

/* Modal Styles - Matching FundsCard design */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  padding: 32px;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.modal-close:hover {
  background-color: #e5e5e5;
  transform: rotate(90deg);
}

.modal-close svg {
  width: 20px;
  height: 20px;
  color: #333;
}

.modal-header-content {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
}

.modal-body-content {
  padding: 0;
}

/* Modal Animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.8) translateY(20px);
}

/* Mobile: Keep heading and button in one line with same size */
@media (max-width: 576px) {
  .d-flex.justify-content-between.align-items-center.mb-4 {
    flex-wrap: nowrap;
    gap: 0.75rem;
  }

  .d-flex.justify-content-between.align-items-center.mb-4 h5 {
    font-size: 1rem;
    margin-bottom: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
    min-width: 0;
  }

  .d-flex.justify-content-between.align-items-center.mb-4 .btn {
    flex-shrink: 0;
    font-size: 0.8125rem;
    padding: 0.4rem 0.875rem;
  }
}
</style>

