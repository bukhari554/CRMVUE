<template>
  <main class="container-fluid py-4">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <h2 class="mb-0 text-dark fw-bold trading-accounts-title">Trading Accounts</h2>
          <ArgonButton
            color="success"
            variant="gradient"
            size="md"
            class="open-account-btn"
            @click="showOpenAccountModal = true"
          >
            Open Account
          </ArgonButton>
        </div>

        <!-- Account Summary Tab (Only Tab) -->
        <div class="mb-4">
          <ul class="nav nav-tabs border-0">
            <li class="nav-item">
              <button
                class="nav-link border-0 text-dark fw-bold active"
                style="border-bottom: 2px solid #344767 !important;"
              >
                Account Summary
              </button>
            </li>
          </ul>
        </div>

        <!-- Filter Section -->
        <div class="d-flex align-items-center gap-2 mb-4 position-relative" @click.self="closeFilterDropdown">
          <div class="position-relative">
            <button
              class="btn filter-btn"
              :class="{ 'active': showFilterDropdown }"
              style="background-color: #344767; color: white; border-radius: 8px; min-width: 48px; height: 38px;"
              @click.stop="toggleFilterDropdown"
            >
              <i class="fas fa-filter"></i>
            </button>
            <!-- Filter Dropdown -->
            <div
              v-if="showFilterDropdown"
              class="filter-dropdown"
              @click.stop
            >
              <div class="filter-dropdown-header p-2 border-bottom">
                <span class="fw-bold text-dark">Filter by Account Type</span>
              </div>
              <div class="filter-dropdown-body">
                <button
                  class="filter-option"
                  :class="{ 'active': selectedFilterAccountType === null }"
                  @click="selectFilterAccountType(null)"
                >
                  All Account Types
                </button>
                <button
                  v-for="accountType in filterAccountTypes"
                  :key="accountType.id"
                  class="filter-option"
                  :class="{ 'active': selectedFilterAccountType === accountType.id }"
                  @click="selectFilterAccountType(accountType.id)"
                >
                  {{ accountType.name }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <LoadingSpinner v-if="loading" message="Loading trading accounts..." />

        <!-- Table -->
        <div v-else-if="filteredAccounts.length === 0" class="text-center text-muted py-5">
          No trading accounts found.
        </div>

        <div v-else class="table-responsive">
          <table class="table align-items-center mb-0" style="background-color: white;">
            <thead>
              <tr>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Platform
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Account
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Type
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Currency
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Balance
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Equity
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Leverage
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Status
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Show Password
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 text-center" style="padding: 0.75rem;">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in filteredAccounts" :key="account.id">
                <td style="padding: 0.75rem;">
                  <span class="text-dark">{{ account.platform || 'N/A' }}</span>
                </td>
                <td style="padding: 0.75rem;">
                  <span class="text-dark">{{ account.account_number || 'N/A' }}</span>
                </td>
                <td style="padding: 0.75rem;">
                  <span class="text-dark">{{ account.account_type?.name || 'Demo' }}</span>
                </td>
                <td style="padding: 0.75rem;">
                  <span class="text-dark">{{ account.currency || 'USD' }}</span>
                </td>
                <td style="padding: 0.75rem;">
                  <span class="text-dark">{{ account.balance !== null && account.balance !== undefined ? formatCurrency(account.balance, account.currency) : 'N/A' }}</span>
                </td>
                <td style="padding: 0.75rem;">
                  <span class="text-dark">{{ account.equity !== null && account.equity !== undefined ? formatCurrency(account.equity, account.currency) : 'N/A' }}</span>
                </td>
                <td style="padding: 0.75rem;">
                  <span class="text-dark">{{ account.leverage?.name || account.mt5_leverage || 'N/A' }}</span>
                </td>
                <td style="padding: 0.75rem;">
                  <span
                    class="badge"
                    :style="{
                      backgroundColor: account.status === 'enabled' ? '#d4edda' : '#f8d7da',
                      color: account.status === 'enabled' ? '#28a745' : '#721c24',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      textTransform: 'capitalize'
                    }"
                  >
                    {{ account.status || 'Enabled' }}
                  </span>
                </td>
                <td style="padding: 0.75rem;">
                  <button
                    class="btn btn-sm btn-link p-0"
                    @click="togglePasswordVisibility(account.id)"
                    :title="passwordVisible[account.id] ? 'Hide Password' : 'Show Password'"
                  >
                    <i
                      class="fas"
                      :class="passwordVisible[account.id] ? 'fa-eye-slash' : 'fa-eye'"
                      style="color: #344767;"
                    ></i>
                  </button>
                  <span v-if="passwordVisible[account.id]" class="ms-2 text-dark">
                    {{ account.mt5_password || 'N/A' }}
                  </span>
                </td>
                <td class="text-center" style="padding: 0.75rem;">
                  <button
                    class="btn btn-sm btn-link p-0"
                    @click="showAccountActions(account)"
                  >
                    <i class="fas fa-ellipsis-v" style="color: #344767;"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Open Account Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showOpenAccountModal"
          class="modal-overlay"
          @click.self="closeModal"
        >
          <div class="modal-container modal-sm-container" @click.stop>
            <button class="modal-close" @click="closeModal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div class="modal-header-content">
              <h5 class="mb-0 fw-bold">Open Account</h5>
            </div>
            <div class="modal-body-content">
          <!-- Loading State for Modal Data -->
          <LoadingSpinner v-if="loadingModalData" message="Loading account options..." size="md" />

          <form v-else @submit.prevent="handleCreateAccount">
            <!-- Select Account Type -->
            <div class="mb-4">
              <label class="form-label text-dark fw-bold mb-3">Select Account Type</label>
              <div class="d-flex flex-column gap-2">
                <div
                  v-for="accountType in accountTypes"
                  :key="accountType.id"
                  class="form-check"
                >
                  <input
                    class="form-check-input"
                    type="radio"
                    :id="`accountType-${accountType.id}`"
                    :value="accountType.id"
                    v-model="createForm.account_type_id"
                    required
                  />
                  <label
                    class="form-check-label text-dark"
                    :for="`accountType-${accountType.id}`"
                  >
                    {{ accountType.name }}
                  </label>
                </div>
              </div>
              <!-- Account Description -->
              <div v-if="selectedAccountTypeDescription" class="mt-3 p-3 bg-light rounded" style="border-left: 3px solid #344767;">
                <div class="mb-0 text-dark" style="font-size: 0.875rem;" v-html="selectedAccountTypeDescription"></div>
              </div>
            </div>

            <!-- Select Leverage -->
            <div class="mb-4">
              <label class="form-label text-dark fw-bold mb-3">Select Leverage</label>
              <div class="d-flex flex-wrap gap-2">
                <button
                  v-for="leverage in leverages"
                  :key="leverage.id"
                  type="button"
                  class="btn"
                  :class="{
                    'btn-outline-dark': createForm.leverage_id !== leverage.id,
                    'btn-dark': createForm.leverage_id === leverage.id
                  }"
                  style="border-radius: 8px;"
                  @click="createForm.leverage_id = leverage.id"
                >
                  {{ leverage.name }}
                </button>
              </div>
        </div>

        <!-- Error Message -->
            <div v-if="errorMessage" class="alert alert-danger mb-3">
              <i class="fas fa-exclamation-circle me-2"></i>
          {{ errorMessage }}
        </div>

        <!-- Success Message -->
            <div v-if="successMessage" class="alert alert-success mb-3">
              <i class="fas fa-check-circle me-2"></i>
          {{ successMessage }}
        </div>

            <!-- Submit Button -->
            <div class="d-flex gap-2 mt-4">
              <ArgonButton
                color="success"
                variant="gradient"
                :fullWidth="true"
                :disabled="isCreating || !createForm.account_type_id || !createForm.leverage_id"
                @click="handleCreateAccount"
              >
                <i class="fas" :class="isCreating ? 'fa-spinner fa-spin' : 'fa-plus'"></i>
                {{ isCreating ? 'Creating Account...' : 'Create Account' }}
              </ArgonButton>
              <ArgonButton
                color="secondary"
                variant="outline"
                @click="closeModal"
              >
                Cancel
              </ArgonButton>
          </div>
          </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { apiGet, apiPost } from '@/utils/api.js';

// State
const tradingAccounts = ref([]);
const loading = ref(false);
const showFilterDropdown = ref(false);
const selectedFilterAccountType = ref(null);
const passwordVisible = ref({});
const showOpenAccountModal = ref(false);
const loadingModalData = ref(false);
const isCreating = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const filterAccountTypes = ref([]);

// Modal form data
const createForm = ref({
  account_type_id: null,
  leverage_id: null,
  account_title: 'METATRADER 5'
});

// Options for modal
const accountTypes = ref([]);
const leverages = ref([]);

// Computed
const filteredAccounts = computed(() => {
  let filtered = tradingAccounts.value;

  // Filter by account type
  if (selectedFilterAccountType.value !== null) {
    filtered = filtered.filter(account => 
      account.account_type?.id === selectedFilterAccountType.value
    );
  }

  return filtered;
});

const selectedAccountTypeDescription = computed(() => {
  if (!createForm.value.account_type_id) {
    return null;
  }
  const selectedType = accountTypes.value.find(
    type => type.id === createForm.value.account_type_id
  );
  return selectedType?.description || null;
});

// Methods
const fetchTradingAccounts = async () => {
  loading.value = true;
  try {
    const response = await apiGet('/client/mt5/accounts');
          const data = await response.json();
    
    if (data.success && data.data && data.data.trading_accounts) {
      tradingAccounts.value = data.data.trading_accounts;
        } else {
      tradingAccounts.value = [];
        }
      } catch (error) {
    console.error('Error fetching trading accounts:', error);
    tradingAccounts.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchAccountTypes = async () => {
  try {
    const response = await apiGet('/client/account-types');
    const data = await response.json();
    
    if (data.success && data.data && data.data.account_types) {
      const activeTypes = data.data.account_types.filter(type => type.is_active);
      accountTypes.value = activeTypes;
      filterAccountTypes.value = activeTypes;
    } else {
      accountTypes.value = [];
      filterAccountTypes.value = [];
    }
  } catch (error) {
    console.error('Error fetching account types:', error);
    accountTypes.value = [];
    filterAccountTypes.value = [];
  }
};

const fetchLeverages = async () => {
  try {
    const response = await apiGet('/client/leverages');
    const data = await response.json();
    
    if (data.success && data.data && data.data.leverages) {
      leverages.value = data.data.leverages.filter(lev => lev.is_active);
        } else {
      leverages.value = [];
        }
      } catch (error) {
    console.error('Error fetching leverages:', error);
    leverages.value = [];
  }
};

const loadModalData = async () => {
  loadingModalData.value = true;
  try {
    await Promise.all([
      fetchAccountTypes(),
      fetchLeverages()
    ]);
  } catch (error) {
    console.error('Error loading modal data:', error);
  } finally {
    loadingModalData.value = false;
  }
};

const handleCreateAccount = async () => {
  if (!createForm.value.account_type_id || !createForm.value.leverage_id) {
    errorMessage.value = 'Please select both account type and leverage';
    return;
  }

  isCreating.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const response = await apiPost('/client/mt5/accounts/create', {
      leverage_id: createForm.value.leverage_id,
      account_type_id: createForm.value.account_type_id,
      account_title: createForm.value.account_title
        });

        const data = await response.json();

    if (response.ok && data.success) {
      successMessage.value = 'Trading account created successfully!';
      // Reset form
      createForm.value = {
        account_type_id: null,
        leverage_id: null,
        account_title: 'METATRADER 5'
      };
      
      // Refresh accounts list
      await fetchTradingAccounts();
      
      // Close modal after a short delay
      setTimeout(() => {
        closeModal();
      }, 1500);
        } else {
      errorMessage.value = data.message || 'Failed to create trading account';
        }
      } catch (error) {
    console.error('Error creating account:', error);
    errorMessage.value = 'An error occurred. Please try again.';
      } finally {
    isCreating.value = false;
  }
};

const togglePasswordVisibility = (accountId) => {
  passwordVisible.value[accountId] = !passwordVisible.value[accountId];
};

const showAccountActions = (account) => {
  // Placeholder for account actions menu
  console.log('Account actions for:', account);
};

const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const closeModal = () => {
  showOpenAccountModal.value = false;
  createForm.value = {
    account_type_id: null,
    leverage_id: null,
    account_title: 'METATRADER 5'
  };
  errorMessage.value = '';
  successMessage.value = '';
};

// Watch for modal opening to load data
watch(showOpenAccountModal, (newVal) => {
  if (newVal) {
    loadModalData();
  }
});

const toggleFilterDropdown = () => {
  showFilterDropdown.value = !showFilterDropdown.value;
};

const closeFilterDropdown = () => {
  showFilterDropdown.value = false;
};

const selectFilterAccountType = (accountTypeId) => {
  selectedFilterAccountType.value = accountTypeId;
  showFilterDropdown.value = false;
};

// Click outside handler for filter dropdown
const handleClickOutside = (event) => {
  const filterButton = event.target.closest('.filter-btn');
  const filterDropdown = event.target.closest('.filter-dropdown');
  
  if (!filterButton && !filterDropdown && showFilterDropdown.value) {
    showFilterDropdown.value = false;
  }
};

// Lifecycle
onMounted(() => {
  fetchTradingAccounts();
  fetchAccountTypes(); // Load account types for filter dropdown
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.nav-tabs .nav-link {
  color: #6c757d;
  border-bottom: 2px solid transparent;
}

.nav-tabs .nav-link.active {
  color: #344767;
  border-bottom: 2px solid #344767 !important;
}

.form-check-input:checked {
  background-color: #344767;
  border-color: #344767;
}

.btn-outline-dark {
  border-color: #344767;
  color: #344767;
}

.btn-outline-dark:hover {
  background-color: #344767;
  color: white;
}

.btn-dark {
  background-color: #344767;
  border-color: #344767;
  color: white;
}

/* Filter Button Styles */
.filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background-color: #2a3a5a !important;
  transform: translateY(-1px);
}

.filter-btn.active {
  background-color: #2a3a5a !important;
}

.filter-btn i {
  font-size: 1rem;
}

/* Filter Dropdown */
.filter-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  max-width: 300px;
  z-index: 1000;
  overflow: hidden;
}

.filter-dropdown-header {
  background-color: #f8f9fa;
}

.filter-dropdown-body {
  max-height: 300px;
  overflow-y: auto;
}

.filter-option {
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  border: none;
  background: white;
  color: #344767;
  transition: all 0.2s ease;
  cursor: pointer;
  font-size: 0.875rem;
}

.filter-option:hover {
  background-color: #f8f9fa;
}

.filter-option.active {
  background-color: #344767;
  color: white;
  font-weight: 600;
}

/* Responsive Styles */
.trading-accounts-title {
  font-size: 1.75rem;
}

.open-account-btn {
  font-size: 0.875rem;
  padding: 0.625rem 1.25rem;
}

@media (max-width: 768px) {
  .trading-accounts-title {
    font-size: 1.5rem;
  }

  .open-account-btn {
    font-size: 0.8rem;
    padding: 0.5rem 1rem;
  }

  .filter-btn {
    min-width: 44px;
    height: 38px;
  }

  .filter-btn i {
    font-size: 0.95rem;
  }
}

@media (max-width: 576px) {
  .trading-accounts-title {
    font-size: 1.25rem;
  }

  .open-account-btn {
    font-size: 0.75rem;
    padding: 0.5rem 0.875rem;
  }

  .card-body {
    padding: 1rem !important;
  }

  .table-responsive {
    font-size: 0.8rem;
  }

  .table th,
  .table td {
    padding: 0.5rem !important;
    font-size: 0.75rem;
  }
}
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

.modal-sm-container {
  max-width: 500px;
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
</style>