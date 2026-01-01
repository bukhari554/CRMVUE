<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import ArgonInput from '@/components/ArgonInput.vue';
import Table from '@/components/Table.vue';
import { apiGet, apiPost } from '@/utils/api.js';

const loadingDeposits = ref(false);
const submitting = ref(false);
const validationErrors = ref({});
const selectedFile = ref(null);
const walletBalance = ref(null);
const walletCurrency = ref('USD');
const deposits = ref([]);
const currentPage = ref(1);
const lastPage = ref(1);
const total = ref(0);

const showAddModal = ref(false);
const cardPaymentMethods = ref([]);
const otherPaymentMethods = ref([]);
const loadingPaymentMethods = ref(false);
const selectedPaymentMethod = ref(null);

const paymentType = ref(''); // 'card' or 'crypto'
const formData = ref({
  payment_method_id: '',
  amount: '',
  description: '',
  screenshot: null,
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

// Load payment methods
const loadPaymentMethods = async () => {
  loadingPaymentMethods.value = true;
  try {
    const [cardResponse, otherResponse] = await Promise.all([
      apiGet('/client/payment-methods?type=card'),
      apiGet('/client/payment-methods?type=other')
    ]);

    if (cardResponse.ok) {
      const cardData = await cardResponse.json();
      if (cardData?.success && cardData?.data?.payment_methods) {
        cardPaymentMethods.value = Array.isArray(cardData.data.payment_methods) 
          ? cardData.data.payment_methods 
          : cardData.data.payment_methods.data || [];
      }
    }

    if (otherResponse.ok) {
      const otherData = await otherResponse.json();
      if (otherData?.success && otherData?.data?.payment_methods) {
        otherPaymentMethods.value = Array.isArray(otherData.data.payment_methods) 
          ? otherData.data.payment_methods 
          : otherData.data.payment_methods.data || [];
      }
    }
  } catch (err) {
    console.error('Error loading payment methods:', err);
  } finally {
    loadingPaymentMethods.value = false;
  }
};

// Load deposit transactions
const loadDeposits = async (page = 1) => {
  loadingDeposits.value = true;
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: '15',
      type: 'deposit',
    });

    const response = await apiGet(`/client/wallet/transactions?${params.toString()}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.data?.transactions) {
        deposits.value = data.data.transactions.data || [];
        currentPage.value = data.data.transactions.current_page || 1;
        lastPage.value = data.data.transactions.last_page || 1;
        total.value = data.data.transactions.total || 0;
      }
    }
  } catch (err) {
    console.error('Error loading deposits:', err);
  } finally {
    loadingDeposits.value = false;
  }
};

// Watch payment type selection
watch(() => paymentType.value, () => {
  formData.value.payment_method_id = '';
  selectedPaymentMethod.value = null;
  formData.value.amount = '';
});

// Watch payment method selection
watch(() => formData.value.payment_method_id, (newId) => {
  if (!newId) {
    selectedPaymentMethod.value = null;
    formData.value.amount = '';
    return;
  }

  // Find selected payment method based on current type
  const methods = paymentType.value === 'card' ? cardPaymentMethods.value : otherPaymentMethods.value;
  selectedPaymentMethod.value = methods.find(m => m.id === parseInt(newId)) || null;

  // Auto-fill amount for card type
  if (selectedPaymentMethod.value?.type === 'card') {
    formData.value.amount = selectedPaymentMethod.value.amount || '';
  } else {
    formData.value.amount = '';
  }
});

// Handle file selection
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPEG, JPG, PNG, or GIF file only.');
      event.target.value = '';
      selectedFile.value = null;
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should not exceed 10MB.');
      event.target.value = '';
      selectedFile.value = null;
      return;
    }
    
    selectedFile.value = file;
    formData.value.screenshot = file;
  }
};

// Submit deposit request
const submitDeposit = async () => {
  // Validate payment type
  if (!paymentType.value) {
    alert('Please select a payment type');
    return;
  }

  // Validate payment method
  if (!formData.value.payment_method_id) {
    alert('Please select a payment method');
    return;
  }

  // For card payments, use the payment method amount. For crypto, validate user input
  if (selectedPaymentMethod.value?.type === 'card') {
    if (!selectedPaymentMethod.value.amount) {
      alert('Selected card payment method does not have an amount configured.');
      return;
    }
    formData.value.amount = selectedPaymentMethod.value.amount;
  } else {
    if (!formData.value.amount || parseFloat(formData.value.amount) < 0.01) {
      alert('Please enter a valid amount (minimum 0.01)');
      return;
    }
  }

  // Validate screenshot/receipt is required
  if (!selectedFile.value) {
    alert('Please upload a receipt (screenshot)');
    validationErrors.value = { screenshot: ['Receipt is required'] };
    return;
  }

  submitting.value = true;
  validationErrors.value = {};
  
  try {
    const formDataToSend = new FormData();
    formDataToSend.append('amount', formData.value.amount);
    formDataToSend.append('currency', 'USD');
    formDataToSend.append('payment_method_id', formData.value.payment_method_id);
    formDataToSend.append('screenshot', selectedFile.value); // Required field
    
    if (formData.value.description) {
      formDataToSend.append('description', formData.value.description);
    }

    const response = await apiPost('/client/wallet/deposit', formDataToSend);
    
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
      alert(data.message || 'Deposit request submitted successfully!');
      closeAddModal();
      loadWalletBalance();
      loadDeposits(currentPage.value);
    }

  } catch (err) {
    console.error('Error submitting deposit:', err);
    alert(err.message || 'Failed to submit deposit request. Please try again.');
  } finally {
    submitting.value = false;
  }
};

// Reset form
const resetForm = () => {
  paymentType.value = '';
  formData.value = {
    payment_method_id: '',
    amount: '',
    description: '',
    screenshot: null,
  };
  selectedFile.value = null;
  selectedPaymentMethod.value = null;
  validationErrors.value = {};
  
  const fileInput = document.getElementById('screenshotInput');
  if (fileInput) fileInput.value = '';
};

// Open add modal
const openAddModal = () => {
  resetForm();
  loadPaymentMethods();
  showAddModal.value = true;
};

// Close add modal
const closeAddModal = () => {
  showAddModal.value = false;
  resetForm();
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

// Copy to clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    alert('Address copied to clipboard!');
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      alert('Address copied to clipboard!');
    } catch (e) {
      alert('Failed to copy. Please copy manually.');
    }
    document.body.removeChild(textArea);
  }
};

// Open card payment link
const openCardLink = () => {
  if (selectedPaymentMethod.value?.card_link) {
    window.open(selectedPaymentMethod.value.card_link, '_blank');
  }
};

// Table columns configuration
const tableColumns = [
  { key: 'payment_type', label: 'Payment Type' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'reference', label: 'Reference' },
  { key: 'description', label: 'Description' },
  { key: 'screenshot', label: 'Screenshot' },
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
    itemName: 'deposits'
  };
});

onMounted(() => {
  loadWalletBalance();
  loadDeposits();
});
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 text-dark fw-bold">
        Deposit History
      </h5>
      <ArgonButton
        color="success"
        variant="gradient"
        size="sm"
        @click="openAddModal"
      >
        <i class="fas fa-plus me-1"></i>
        Add Deposit
      </ArgonButton>
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
      <template #cell-payment_type="{ row }">
        <span :class="`badge bg-${row.metadata?.payment_method?.type === 'card' ? 'primary' : 'info'}`">
          {{ row.metadata?.payment_method?.type === 'card' ? 'Card' : (row.metadata?.payment_method?.payment_method_name || 'Crypto') }}
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
    </Table>

    <!-- Add Deposit Modal -->
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
                <i class="fas fa-arrow-down me-2"></i>
                Add Deposit
              </h5>
            </div>
            <div class="modal-body-content">
            <form @submit.prevent="submitDeposit">
              <div v-if="loadingPaymentMethods" class="text-center py-4">
                <i class="fas fa-spinner fa-spin me-2"></i>
                Loading payment methods...
              </div>

              <div v-else>
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label fw-semibold">Payment Type *</label>
                    <select
                      v-model="paymentType"
                      class="form-select"
                      required
                    >
                      <option value="">Select Payment Type</option>
                      <option value="card">Card</option>
                      <option value="crypto">Crypto</option>
                    </select>
                  </div>

                  <div v-if="paymentType === 'card'" class="col-12">
                    <label class="form-label fw-semibold">Card Methods *</label>
                    <select
                      v-model="formData.payment_method_id"
                      class="form-select"
                      :class="{ 'is-invalid': hasError('payment_method_id') }"
                      required
                    >
                      <option value="">Select Card Method</option>
                      <option
                        v-for="method in cardPaymentMethods"
                        :key="method.id"
                        :value="method.id"
                      >
                        $ {{ method.amount }} Deposit
                      </option>
                    </select>
                    <div v-if="hasError('payment_method_id')" class="invalid-feedback d-block">
                      {{ getError('payment_method_id') }}
                    </div>
                    <small v-if="cardPaymentMethods.length === 0" class="text-danger">
                      No card payment methods available. Please contact support.
                    </small>
                  </div>

                  <div v-if="paymentType === 'crypto'" class="col-12">
                    <label class="form-label fw-semibold">Crypto Methods *</label>
                    <select
                      v-model="formData.payment_method_id"
                      class="form-select"
                      :class="{ 'is-invalid': hasError('payment_method_id') }"
                      required
                    >
                      <option value="">Select Crypto Method</option>
                      <option
                        v-for="method in otherPaymentMethods"
                        :key="method.id"
                        :value="method.id"
                      >
                        {{ method.payment_method_name }} ({{ method.network }})
                      </option>
                    </select>
                    <div v-if="hasError('payment_method_id')" class="invalid-feedback d-block">
                      {{ getError('payment_method_id') }}
                    </div>
                    <small v-if="otherPaymentMethods.length === 0" class="text-danger">
                      No crypto payment methods available. Please contact support.
                    </small>
                  </div>

                  <!-- Amount field (only for crypto payments) -->
                  <div v-if="selectedPaymentMethod && selectedPaymentMethod.type === 'other'" class="col-12">
                    <label class="form-label fw-semibold">Amount (USD) *</label>
                    <ArgonInput
                      v-model="formData.amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Enter amount"
                      :class="{ 'is-invalid': hasError('amount') }"
                      required
                    />
                    <small class="text-muted">Minimum: 0.01</small>
                    <div v-if="hasError('amount')" class="invalid-feedback d-block">
                      {{ getError('amount') }}
                    </div>
                  </div>

                  <!-- Show selected crypto payment method details in gray container -->
                  <div v-if="selectedPaymentMethod && selectedPaymentMethod.type === 'other'" class="col-12">
                    <div class="crypto-details-container p-4 rounded">
                      <div class="mb-3">
                        <strong class="d-block mb-2">Network:</strong>
                        <span>{{ selectedPaymentMethod.network }}</span>
                      </div>
                      <div class="mb-3">
                        <strong class="d-block mb-2">Address:</strong>
                        <div class="bg-white p-2 rounded border d-flex align-items-center">
                          <code class="font-monospace flex-grow-1 mb-0">{{ selectedPaymentMethod.network_address }}</code>
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary ms-2"
                            @click="copyToClipboard(selectedPaymentMethod.network_address)"
                          >
                            <i class="fas fa-copy"></i>
                          </button>
                        </div>
                      </div>
                      <div v-if="selectedPaymentMethod.barcode_image_path" class="text-center">
                        <strong class="d-block mb-2">QR Code:</strong>
                        <img 
                          :src="selectedPaymentMethod.barcode_image_path" 
                          alt="Barcode" 
                          class="img-fluid rounded border"
                          style="max-height: 250px; background: white; padding: 10px;"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Proceed to Payment Button (only for card payments, above receipt) -->
                  <div v-if="selectedPaymentMethod && selectedPaymentMethod.type === 'card' && selectedPaymentMethod.card_link" class="col-12">
                    <ArgonButton
                      color="primary"
                      variant="gradient"
                      size="md"
                      @click="openCardLink"
                      class="w-100"
                    >
                      <i class="fas fa-arrow-right me-1"></i>
                      Proceed to Payment
                    </ArgonButton>
                  </div>

                  <div class="col-12">
                    <label class="form-label fw-semibold">Receipt *</label>
                    <input
                      id="screenshotInput"
                      type="file"
                      class="form-control"
                      :class="{ 'is-invalid': hasError('screenshot') }"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      @change="handleFileChange"
                      required
                    />
                    <small class="text-muted">JPEG, JPG, PNG, GIF (Max 10MB)</small>
                    <div v-if="hasError('screenshot')" class="invalid-feedback d-block">
                      {{ getError('screenshot') }}
                    </div>
                  </div>

                  <div v-if="selectedFile" class="col-12">
                    <div class="alert alert-info mb-0">
                      <i class="fas fa-file me-2"></i>
                      Selected: {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(2) }} KB)
                    </div>
                  </div>

                  <div class="col-12">
                    <div class="alert alert-warning mb-0">
                      <i class="fas fa-info-circle me-2"></i>
                      Your deposit request will be reviewed by an administrator. The funds will be added to your wallet once approved.
                    </div>
                  </div>

                  <!-- Description field at the bottom -->
                  <div class="col-12">
                    <label class="form-label fw-semibold">Description</label>
                    <textarea
                      v-model="formData.description"
                      class="form-control"
                      rows="3"
                      placeholder="Optional description (max 500 characters)"
                      maxlength="500"
                    ></textarea>
                    <small class="text-muted">{{ formData.description.length }}/500 characters</small>
                  </div>

                  <!-- Submit Button -->
                  <div class="col-12">
                    <ArgonButton
                      color="success"
                      variant="gradient"
                      size="md"
                      @click="submitDeposit"
                      :disabled="submitting || loadingPaymentMethods || !formData.payment_method_id || !paymentType || !selectedFile"
                      class="w-100"
                      type="button"
                    >
                      <i v-if="submitting" class="fas fa-spinner fa-spin me-1"></i>
                      <i v-else class="fas fa-paper-plane me-1"></i>
                      {{ submitting ? 'Submitting...' : 'Submit' }}
                    </ArgonButton>
                  </div>
                </div>
              </div>
            </form>
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
.modal { display: block; }
.font-monospace { font-family: 'Courier New', monospace; }
.crypto-details-container {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
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
