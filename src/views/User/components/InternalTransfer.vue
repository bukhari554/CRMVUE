<script setup>
import { ref, onMounted, watch } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import ArgonInput from '@/components/ArgonInput.vue';
import { apiGet, apiPost } from '@/utils/api.js';

const submitting = ref(false);
const validationErrors = ref({});
const walletBalance = ref(null);
const walletCurrency = ref('USD');
const tradingAccounts = ref([]);
const loadingAccounts = ref(false);

// Transfer type: 'wallet-to-trading', 'trading-to-wallet', 'trading-to-trading'
const transferType = ref('wallet-to-trading');

const formData = ref({
  from_trading_account_id: '',
  to_trading_account_id: '',
  trading_account_id: '',
  amount: '',
  description: '',
  reference: '',
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
      }
    }
  } catch (err) {
    console.error('Error loading wallet balance:', err);
  }
};

// Load trading accounts
const loadTradingAccounts = async () => {
  loadingAccounts.value = true;
  try {
    const response = await apiGet('/client/mt5/accounts');
    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.data?.trading_accounts) {
        tradingAccounts.value = data.data.trading_accounts;
      } else {
        tradingAccounts.value = [];
      }
    }
  } catch (err) {
    console.error('Error loading trading accounts:', err);
    tradingAccounts.value = [];
  } finally {
    loadingAccounts.value = false;
  }
};

// Generate reference
const generateReference = () => {
  const prefix = transferType.value === 'wallet-to-trading' ? 'TRF' 
    : transferType.value === 'trading-to-wallet' ? 'TRF-FROM' 
    : 'TRF-BETWEEN';
  const random = Math.random().toString(36).substring(2, 11).toUpperCase();
  const timestamp = Date.now();
  return `${prefix}-${random}-${timestamp}`;
};

// Watch transfer type change
watch(() => transferType.value, () => {
  formData.value = {
    from_trading_account_id: '',
    to_trading_account_id: '',
    trading_account_id: '',
    amount: '',
    description: '',
    reference: '',
  };
  validationErrors.value = {};
});

// Submit transfer
const submitTransfer = async () => {
  // Validate amount
  if (!formData.value.amount || parseFloat(formData.value.amount) <= 0) {
    alert('Please enter a valid amount');
    return;
  }

  // Validate based on transfer type
  if (transferType.value === 'wallet-to-trading') {
    if (!formData.value.trading_account_id) {
      alert('Please select a trading account');
      return;
    }
    if (walletBalance.value !== null && parseFloat(formData.value.amount) > walletBalance.value) {
      alert(`Insufficient balance. Available balance: ${walletCurrency.value} ${walletBalance.value.toFixed(2)}`);
      return;
    }
  } else if (transferType.value === 'trading-to-wallet') {
    if (!formData.value.trading_account_id) {
      alert('Please select a trading account');
      return;
    }
  } else if (transferType.value === 'trading-to-trading') {
    if (!formData.value.from_trading_account_id || !formData.value.to_trading_account_id) {
      alert('Please select both source and destination trading accounts');
      return;
    }
    if (formData.value.from_trading_account_id === formData.value.to_trading_account_id) {
      alert('Source and destination accounts cannot be the same');
      return;
    }
  }

  submitting.value = true;
  validationErrors.value = {};
  
  // Generate reference
  formData.value.reference = generateReference();

  try {
    let endpoint = '';
    let payload = {};

    if (transferType.value === 'wallet-to-trading') {
      endpoint = '/client/wallet/transfer';
      payload = {
        trading_account_id: parseInt(formData.value.trading_account_id),
        amount: parseFloat(formData.value.amount),
        description: formData.value.description || 'Transfer to trading account',
        reference: formData.value.reference,
      };
    } else if (transferType.value === 'trading-to-wallet') {
      endpoint = '/client/wallet/transfer-from-trading';
      payload = {
        trading_account_id: parseInt(formData.value.trading_account_id),
        amount: parseFloat(formData.value.amount),
        description: formData.value.description || 'Withdraw profits to wallet',
        reference: formData.value.reference,
      };
    } else if (transferType.value === 'trading-to-trading') {
      endpoint = '/client/wallet/transfer-between-trading';
      payload = {
        from_trading_account_id: parseInt(formData.value.from_trading_account_id),
        to_trading_account_id: parseInt(formData.value.to_trading_account_id),
        amount: parseFloat(formData.value.amount),
        description: formData.value.description || 'Transfer between trading accounts',
        reference: formData.value.reference,
      };
    }

    const response = await apiPost(endpoint, payload);
    
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
      alert(data.message || 'Transfer completed successfully!');
      resetForm();
      loadWalletBalance();
      loadTradingAccounts();
    }

  } catch (err) {
    console.error('Error submitting transfer:', err);
    alert(err.message || 'Failed to complete transfer. Please try again.');
  } finally {
    submitting.value = false;
  }
};

// Reset form
const resetForm = () => {
  formData.value = {
    from_trading_account_id: '',
    to_trading_account_id: '',
    trading_account_id: '',
    amount: '',
    description: '',
    reference: '',
  };
  validationErrors.value = {};
};

// Get account display name with balance
const getAccountDisplay = (account) => {
  const accountNumber = account.account_number || account.id;
  const accountType = account.account_type?.name || 'N/A';
  const currency = account.currency || 'USD';
  const balance = account.balance !== null && account.balance !== undefined 
    ? parseFloat(account.balance).toFixed(2) 
    : '0.00';
  return `${accountNumber} - ${accountType} (${currency}) - Balance: ${currency} ${balance}`;
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

onMounted(() => {
  loadWalletBalance();
  loadTradingAccounts();
});
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="loadingAccounts" class="card border-0 shadow-sm mb-4">
      <div class="card-body p-5 text-center">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <h6 class="text-muted mb-0">Loading trading accounts...</h6>
      </div>
    </div>

    <!-- Main Form -->
    <div v-else>
      <h5 class="mb-4 text-dark fw-bold d-flex align-items-center justify-content-between">
        <span>Internal Transfer</span>
      </h5>

      <form @submit.prevent="submitTransfer">
          <!-- Transfer Type Selection -->
          <div class="mb-4">
            <label class="form-label fw-semibold mb-3">Transfer Type *</label>
            <div class="row g-3">
              <div class="col-md-4">
                <div 
                  class="transfer-type-card p-3 rounded border cursor-pointer h-100"
                  :class="{ 'active': transferType === 'wallet-to-trading' }"
                  @click="transferType = 'wallet-to-trading'"
                >
                  <div class="form-check mb-0">
                    <input 
                      class="form-check-input" 
                      type="radio" 
                      :value="'wallet-to-trading'"
                      v-model="transferType"
                      id="type-wallet-to-trading"
                    />
                    <label class="form-check-label fw-semibold mb-0 d-block" for="type-wallet-to-trading">
                      <i class="fas fa-arrow-right me-2 text-primary"></i>
                      Wallet → Trading Account
                    </label>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div 
                  class="transfer-type-card p-3 rounded border cursor-pointer h-100"
                  :class="{ 'active': transferType === 'trading-to-wallet' }"
                  @click="transferType = 'trading-to-wallet'"
                >
                  <div class="form-check mb-0">
                    <input 
                      class="form-check-input" 
                      type="radio" 
                      :value="'trading-to-wallet'"
                      v-model="transferType"
                      id="type-trading-to-wallet"
                    />
                    <label class="form-check-label fw-semibold mb-0 d-block" for="type-trading-to-wallet">
                      <i class="fas fa-arrow-left me-2 text-success"></i>
                      Trading Account → Wallet
                    </label>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div 
                  class="transfer-type-card p-3 rounded border cursor-pointer h-100"
                  :class="{ 'active': transferType === 'trading-to-trading' }"
                  @click="transferType = 'trading-to-trading'"
                >
                  <div class="form-check mb-0">
                    <input 
                      class="form-check-input" 
                      type="radio" 
                      :value="'trading-to-trading'"
                      v-model="transferType"
                      id="type-trading-to-trading"
                    />
                    <label class="form-check-label fw-semibold mb-0 d-block" for="type-trading-to-trading">
                      <i class="fas fa-exchange-alt me-2 text-info"></i>
                      Trading Account → Trading Account
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Wallet to Trading Account -->
          <template v-if="transferType === 'wallet-to-trading'">
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <label class="form-label fw-semibold">From</label>
                <select class="form-select" disabled style="height: 38px;">
                  <option selected>My Wallet ({{ walletCurrency }})</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">To Trading Account *</label>
                <select
                  v-model="formData.trading_account_id"
                  class="form-select"
                  :class="{ 'is-invalid': hasError('trading_account_id') }"
                  :disabled="loadingAccounts"
                  required
                  style="height: 38px;"
                >
                  <option value="">Select Trading Account</option>
                  <option
                    v-for="account in tradingAccounts"
                    :key="account.id"
                    :value="account.id"
                  >
                    {{ getAccountDisplay(account) }}
                  </option>
                </select>
                <div v-if="hasError('trading_account_id')" class="invalid-feedback d-block">
                  {{ getError('trading_account_id') }}
                </div>
                <small v-if="tradingAccounts.length === 0 && !loadingAccounts" class="text-danger d-block mt-1">
                  No trading accounts found. Please create a trading account first.
                </small>
              </div>
            </div>

            <!-- Wallet Information -->
            <div class="card border-0 shadow-sm mb-4 bg-light">
              <div class="card-body p-4">
                <h6 class="mb-3 text-dark fw-bold">My Wallet Information</h6>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">Current Balance</span>
                  <span class="fw-bold fs-5 text-primary">{{ walletCurrency }} {{ walletBalance !== null ? walletBalance.toFixed(2) : '0.00' }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Trading Account to Wallet -->
          <template v-if="transferType === 'trading-to-wallet'">
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <label class="form-label fw-semibold">From Trading Account *</label>
                <select
                  v-model="formData.trading_account_id"
                  class="form-select"
                  :class="{ 'is-invalid': hasError('trading_account_id') }"
                  :disabled="loadingAccounts"
                  required
                  style="height: 38px;"
                >
                  <option value="">Select Trading Account</option>
                  <option
                    v-for="account in tradingAccounts"
                    :key="account.id"
                    :value="account.id"
                  >
                    {{ getAccountDisplay(account) }}
                  </option>
                </select>
                <div v-if="hasError('trading_account_id')" class="invalid-feedback d-block">
                  {{ getError('trading_account_id') }}
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">To</label>
                <select class="form-select" disabled style="height: 38px;">
                  <option selected>My Wallet ({{ walletCurrency }})</option>
                </select>
              </div>
            </div>

            <!-- Wallet Information -->
            <div class="card border-0 shadow-sm mb-4 bg-light">
              <div class="card-body p-4">
                <h6 class="mb-3 text-dark fw-bold">My Wallet Information</h6>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">Current Balance</span>
                  <span class="fw-bold fs-5 text-primary">{{ walletCurrency }} {{ walletBalance !== null ? walletBalance.toFixed(2) : '0.00' }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Trading Account to Trading Account -->
          <template v-if="transferType === 'trading-to-trading'">
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <label class="form-label fw-semibold">From Trading Account *</label>
                <select
                  v-model="formData.from_trading_account_id"
                  class="form-select"
                  :class="{ 'is-invalid': hasError('from_trading_account_id') }"
                  :disabled="loadingAccounts"
                  required
                  style="height: 38px;"
                >
                  <option value="">Select Source Trading Account</option>
                  <option
                    v-for="account in tradingAccounts"
                    :key="account.id"
                    :value="account.id"
                  >
                    {{ getAccountDisplay(account) }}
                  </option>
                </select>
                <div v-if="hasError('from_trading_account_id')" class="invalid-feedback d-block">
                  {{ getError('from_trading_account_id') }}
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-semibold">To Trading Account *</label>
                <select
                  v-model="formData.to_trading_account_id"
                  class="form-select"
                  :class="{ 'is-invalid': hasError('to_trading_account_id') }"
                  :disabled="loadingAccounts"
                  required
                  style="height: 38px;"
                >
                  <option value="">Select Destination Trading Account</option>
                  <option
                    v-for="account in tradingAccounts"
                    :key="account.id"
                    :value="account.id"
                    :disabled="account.id === parseInt(formData.from_trading_account_id)"
                  >
                    {{ getAccountDisplay(account) }}
                  </option>
                </select>
                <div v-if="hasError('to_trading_account_id')" class="invalid-feedback d-block">
                  {{ getError('to_trading_account_id') }}
                </div>
              </div>
            </div>
          </template>

          <!-- Amount to Transfer -->
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body p-4">
              <h6 class="mb-3 text-dark fw-bold">Amount to Transfer</h6>
              <div class="row g-3">
                <div class="col-md-8">
                  <label class="form-label fw-semibold">Amount</label>
                  <ArgonInput
                    v-model="formData.amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Enter Amount"
                    :class="{ 'is-invalid': hasError('amount') }"
                    required
                  />
                  <div v-if="hasError('amount')" class="invalid-feedback d-block">
                    {{ getError('amount') }}
                  </div>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Currency</label>
                  <div class="form-control bg-light border-0 fw-semibold d-flex align-items-center" style="height: 38px;">
                    {{ walletCurrency }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-4">
            <label class="form-label fw-semibold">Description</label>
            <textarea
              v-model="formData.description"
              class="form-control"
              rows="3"
              placeholder="Optional description (max 500 characters)"
              maxlength="500"
            ></textarea>
            <small class="text-muted mt-1 d-block">{{ formData.description.length }}/500 characters</small>
          </div>

          <!-- Submit Button -->
          <div class="d-flex gap-2">
            <ArgonButton
              color="success"
              variant="gradient"
              size="md"
              @click="submitTransfer"
              :disabled="submitting || loadingAccounts"
              class="flex-grow-1"
              type="button"
            >
              <i v-if="submitting" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-exchange-alt me-1"></i>
              {{ submitting ? 'Processing...' : 'Submit Transfer' }}
            </ArgonButton>
            <ArgonButton
              color="secondary"
              variant="outline"
              size="md"
              @click="resetForm"
              :disabled="submitting"
              type="button"
            >
              Reset
            </ArgonButton>
          </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.form-label {
  margin-bottom: 0.5rem;
  color: #344767;
  display: block;
}

.form-select,
.form-control {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d2d6da;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  width: 100%;
}

.form-select {
  height: 38px;
  line-height: 1.5;
}

.is-invalid {
  border-color: #dc3545 !important;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.transfer-type-card {
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 70px;
  display: flex;
  align-items: center;
}

.transfer-type-card:hover {
  background-color: #f8f9fa;
  border-color: #0d6efd !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.transfer-type-card.active {
  background-color: #e7f1ff;
  border-color: #0d6efd !important;
  box-shadow: 0 2px 4px rgba(13, 110, 253, 0.2);
}

.cursor-pointer {
  cursor: pointer;
}

.card {
  background-color: white;
  border-radius: 0.5rem;
}
</style>

