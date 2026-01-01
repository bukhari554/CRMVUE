<script setup>
import { ref, onMounted } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import ArgonInput from '@/components/ArgonInput.vue';
import Table from '@/components/Table.vue';
import { apiGet, apiPost, apiDelete } from '@/utils/api.js';

// State
const cryptoWallets = ref([]);
const loading = ref(false);
const showAddModal = ref(false);
const submitting = ref(false);
const validationErrors = ref({});

// Crypto Wallet Form Data
const formData = ref({
  wallet_address: '',
  crypto_currency: 'BTC',
  crypto_network: 'BTC',
});

// Load crypto wallets - GET
const loadCryptoWallets = async () => {
  loading.value = true;
  try {
    const response = await apiGet('/client/crypto-wallets');
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error('Received HTML instead of JSON - API endpoint may not exist');
      throw new Error('API endpoint not found. Please check your backend routes.');
    }
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('Unauthenticated - Token missing or invalid');
        cryptoWallets.value = [];
        return;
      }
      
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      console.error('Error response:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Crypto wallets response:', data);

    if (data && data.success) {
      if (Array.isArray(data.data)) {
        cryptoWallets.value = data.data;
      } else if (data.data && Array.isArray(data.data.crypto_wallets)) {
        cryptoWallets.value = data.data.crypto_wallets;
      } else {
        cryptoWallets.value = [];
      }
    } else if (Array.isArray(data)) {
      cryptoWallets.value = data;
    } else {
      cryptoWallets.value = [];
    }

  } catch (err) {
    console.error('Error loading crypto wallets:', err);
    
    if (err.message.includes('not found') || err.message.includes('HTML')) {
      console.error('Crypto wallets API is not properly configured.');
    } else if (err.message.includes('Unauthenticated') || err.message.includes('401')) {
      console.log('User needs to login');
    } else {
      console.error('Failed to load crypto wallets:', err.message);
    }
    
    cryptoWallets.value = [];
  } finally {
    loading.value = false;
  }
};

// Handle crypto currency change - auto-set network
const handleCryptoCurrencyChange = () => {
  if (formData.value.crypto_currency === 'BTC') {
    formData.value.crypto_network = 'BTC';
  } else if (formData.value.crypto_currency === 'USDT') {
    formData.value.crypto_network = 'USDT TRC20';
  }
};

// Add new crypto wallet - POST
const addCryptoWallet = async () => {
  if (!formData.value.wallet_address) {
    alert('Wallet address is required');
    return;
  }
  if (!formData.value.crypto_currency) {
    alert('Crypto currency is required');
    return;
  }
  if (!formData.value.crypto_network) {
    alert('Crypto network is required');
    return;
  }

  // Validate network matches currency
  if (formData.value.crypto_currency === 'BTC' && formData.value.crypto_network !== 'BTC') {
    alert('For BTC currency, the network must be BTC.');
    return;
  }
  if (formData.value.crypto_currency === 'USDT' && formData.value.crypto_network !== 'USDT TRC20') {
    alert('For USDT currency, the network must be USDT TRC20.');
    return;
  }

  submitting.value = true;
  validationErrors.value = {};
  
  try {
    const response = await apiPost('/client/crypto-wallets', {
      wallet_address: formData.value.wallet_address,
      crypto_currency: formData.value.crypto_currency,
      crypto_network: formData.value.crypto_network,
    });
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('API endpoint not found. Received HTML instead of JSON.');
    }
    
    const data = await response.json();
    console.log('Response:', data);

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
      alert(data.message || 'Crypto wallet added successfully!');
      showAddModal.value = false;
      resetForm();
      loadCryptoWallets();
    }

  } catch (err) {
    console.error('Error adding crypto wallet:', err);
    alert(err.message || 'Failed to add crypto wallet. Please try again.');
  } finally {
    submitting.value = false;
  }
};

// Delete crypto wallet - DELETE
const deleteCryptoWallet = async (walletId) => {
  if (!confirm('Are you sure you want to delete this crypto wallet?')) {
    return;
  }

  try {
    const response = await apiDelete(`/client/crypto-wallets/${walletId}`);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('API endpoint not found.');
    }
    
    if (response.status === 401) {
      console.error('Unauthenticated - Token missing or invalid');
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    if (data && (data.success || data.message)) {
      alert(data.message || 'Crypto wallet deleted successfully!');
      loadCryptoWallets();
    } else {
      loadCryptoWallets();
    }

  } catch (err) {
    console.error('Error deleting crypto wallet:', err);
    
    if (!err.message.includes('Unauthenticated') && !err.message.includes('401')) {
      alert(err.message || 'Failed to delete crypto wallet. Please try again.');
    }
  }
};

// Reset crypto form
const resetForm = () => {
  formData.value = {
    wallet_address: '',
    crypto_currency: 'BTC',
    crypto_network: 'BTC',
  };
  validationErrors.value = {};
};

const openAddModal = () => {
  resetForm();
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
  resetForm();
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

// Table columns configuration
const tableColumns = [
  { key: 'crypto_currency', label: 'Currency' },
  { key: 'crypto_network', label: 'Network' },
  { key: 'wallet_address', label: 'Wallet Address' },
  { key: 'actions', label: 'Actions' }
];

onMounted(() => {
  loadCryptoWallets();
});
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 text-dark fw-bold">
        Your Crypto Wallet
      </h5>
      <ArgonButton
        color="success"
        variant="gradient"
        size="sm"
        @click="openAddModal"
      >
        <i class="fas fa-plus me-1"></i>
        Add Crypto Wallet
      </ArgonButton>
    </div>

    <!-- Crypto Wallets Table -->
    <Table
      :columns="tableColumns"
      :data="cryptoWallets"
      :loading="loading"
      loading-text="Loading crypto wallets..."
      empty-text="No crypto wallets found."
    >
      <template #cell-crypto_currency="{ row }">
        <span class="fw-bold">{{ row.crypto_currency || '—' }}</span>
      </template>

      <template #cell-crypto_network="{ row }">
        {{ row.crypto_network || '—' }}
      </template>

      <template #cell-wallet_address="{ row }">
        <span class="font-monospace">{{ row.wallet_address || '—' }}</span>
      </template>

      <template #cell-actions="{ row }">
        <button
          class="btn btn-sm btn-outline-danger"
          @click="deleteCryptoWallet(row.id)"
          title="Delete Wallet"
        >
          <i class="fas fa-trash"></i>
        </button>
      </template>
    </Table>

    <!-- Add Crypto Wallet Modal -->
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
                <i class="fas fa-coins me-2"></i>
                Add Crypto Wallet
              </h5>
            </div>
            <div class="modal-body-content">
            <form @submit.prevent="addCryptoWallet">
              <h6 class="text-dark fw-bold mb-3">
                <i class="fas fa-wallet me-2"></i>
                Wallet Information
              </h6>
              <div class="row g-3 mb-4">
                <div class="col-12">
                  <label class="form-label text-sm fw-semibold">Crypto Currency *</label>
                  <select
                    v-model="formData.crypto_currency"
                    class="form-select"
                    :class="{ 'is-invalid': hasError('crypto_currency') }"
                    @change="handleCryptoCurrencyChange"
                    required
                  >
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="USDT">Tether (USDT)</option>
                  </select>
                  <div v-if="hasError('crypto_currency')" class="invalid-feedback d-block">
                    {{ getError('crypto_currency') }}
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label text-sm fw-semibold">Network *</label>
                  <input
                    v-model="formData.crypto_network"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': hasError('crypto_network') }"
                    :readonly="true"
                    required
                  />
                  <small class="text-muted">
                    <span v-if="formData.crypto_currency === 'BTC'">
                      Network is automatically set to BTC for Bitcoin.
                    </span>
                    <span v-else>
                      Network is automatically set to USDT TRC20 for Tether.
                    </span>
                  </small>
                  <div v-if="hasError('crypto_network')" class="invalid-feedback d-block">
                    {{ getError('crypto_network') }}
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label text-sm fw-semibold">Wallet Address *</label>
                  <ArgonInput
                    v-model="formData.wallet_address"
                    type="text"
                    placeholder="Enter wallet address"
                    :class="{ 'is-invalid': hasError('wallet_address') }"
                    required
                  />
                  <small class="text-muted">Enter your {{ formData.crypto_currency }} wallet address (max 500 characters)</small>
                  <div v-if="hasError('wallet_address')" class="invalid-feedback d-block">
                    {{ getError('wallet_address') }}
                  </div>
                </div>
              </div>
            </form>
            </div>
            <div class="modal-footer-content">
              <ArgonButton
                color="secondary"
                variant="outline"
                size="sm"
                @click="closeAddModal"
                :disabled="submitting"
              >
                Cancel
              </ArgonButton>
              <ArgonButton
                color="success"
                variant="gradient"
                size="sm"
                @click="addCryptoWallet"
                :disabled="submitting"
              >
                <i v-if="submitting" class="fas fa-spinner fa-spin me-1"></i>
                <i v-else class="fas fa-save me-1"></i>
                {{ submitting ? 'Saving...' : 'Save Wallet' }}
              </ArgonButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.font-monospace { font-family: 'Courier New', monospace; }
.modal { display: block; }
.form-select, .form-control {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d2d6da;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}
.form-label { margin-bottom: 0.5rem; color: #344767; }
.is-invalid { border-color: #dc3545 !important; }
.invalid-feedback { color: #dc3545; font-size: 0.75rem; margin-top: 0.25rem; }

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

.modal-footer-content {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

