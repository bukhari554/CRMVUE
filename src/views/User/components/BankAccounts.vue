<script setup>
import { ref, onMounted } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import ArgonInput from '@/components/ArgonInput.vue';
import Table from '@/components/Table.vue';
import { apiGet, apiPost, apiDelete } from '@/utils/api.js';

// State
const bankAccounts = ref([]);
const loading = ref(false);
const showAddModal = ref(false);
const submitting = ref(false);
const validationErrors = ref({});
const selectedFile = ref(null);

// Form data matching database structure
const formData = ref({
  bank_name: '',
  bank_address: '',
  bank_state_province: '',
  bank_zip_code: '',
  country: '',
  iban: '',
  swift_code: '',
  beneficiary_first_name: '',
  beneficiary_last_name: '',
  beneficiary_address: '',
  beneficiary_country: '',
  beneficiary_state_province: '',
  beneficiary_zip_code: '',
  document_type: 'bank_statement',
  document: null,
});

// Load bank accounts - GET
const loadBankAccounts = async () => {
  loading.value = true;
  try {
    const response = await apiGet('/client/bank-accounts');
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Check if response is HTML (404/500 error)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error('Received HTML instead of JSON - API endpoint may not exist');
      throw new Error('API endpoint not found. Please check your backend routes.');
    }
    
    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        console.error('Unauthenticated - Token missing or invalid');
        bankAccounts.value = [];
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
    console.log('Bank accounts response:', data);

    if (data && data.success) {
      if (data.data && Array.isArray(data.data.bank_accounts)) {
        bankAccounts.value = data.data.bank_accounts;
      } else if (Array.isArray(data.data)) {
        bankAccounts.value = data.data;
      } else if (data.data && Array.isArray(data.data.accounts)) {
        bankAccounts.value = data.data.accounts;
      } else {
        bankAccounts.value = [];
      }
    } else if (Array.isArray(data)) {
      bankAccounts.value = data;
    } else {
      bankAccounts.value = [];
    }

  } catch (err) {
    console.error('Error loading bank accounts:', err);
    
    if (err.message.includes('not found') || err.message.includes('HTML')) {
      alert('Bank accounts API is not properly configured. Please contact support.');
    } else if (err.message.includes('Unauthenticated') || err.message.includes('401')) {
      console.log('User needs to login');
    } else {
      console.error('Failed to load bank accounts:', err.message);
    }
    
    bankAccounts.value = [];
  } finally {
    loading.value = false;
  }
};

// Handle file selection
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, JPG, or PNG file only.');
      event.target.value = '';
      selectedFile.value = null;
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should not exceed 5MB.');
      event.target.value = '';
      selectedFile.value = null;
      return;
    }
    
    selectedFile.value = file;
    formData.value.document = file;
  }
};

// Add new bank account - POST with FormData
const addBankAccount = async () => {
  if (!formData.value.bank_name) {
    alert('Bank name is required');
    return;
  }
  if (!formData.value.beneficiary_first_name || !formData.value.beneficiary_last_name) {
    alert('Beneficiary name is required');
    return;
  }
  if (!selectedFile.value) {
    alert('Please upload a document (Bank statement, Void cheque, etc.)');
    return;
  }

  submitting.value = true;
  validationErrors.value = {};
  
  try {
    const formDataToSend = new FormData();
    
    // Append all form fields (except document which is handled separately)
    Object.keys(formData.value).forEach(key => {
      if (key !== 'document') {
        const value = formData.value[key];
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      }
    });
    
    // Append document file
    if (selectedFile.value) {
      formDataToSend.append('document', selectedFile.value);
      console.log('✅ Document file attached:', {
        name: selectedFile.value.name,
        size: selectedFile.value.size,
        type: selectedFile.value.type
      });
    } else {
      console.error('❌ No file selected!');
      alert('Please upload a document (Bank statement, Void cheque, etc.)');
      submitting.value = false;
      return;
    }

    console.log('Submitting to:', `/client/bank-accounts`);

    const response = await apiPost('/client/bank-accounts', formDataToSend);
    
    console.log('Response status:', response.status);
    
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
      alert(data.message || 'Bank account added successfully!');
      showAddModal.value = false;
      resetForm();
      loadBankAccounts();
    }

  } catch (err) {
    console.error('Error adding bank account:', err);
    alert(err.message || 'Failed to add bank account. Please try again.');
  } finally {
    submitting.value = false;
  }
};

// Delete bank account - DELETE
const deleteBankAccount = async (accountId) => {
  if (!confirm('Are you sure you want to delete this bank account?')) {
    return;
  }

  try {
    const response = await apiDelete(`/client/bank-accounts/${accountId}`);
    
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
      alert(data.message || 'Bank account deleted successfully!');
      loadBankAccounts();
    } else {
      loadBankAccounts();
    }

  } catch (err) {
    console.error('Error deleting bank account:', err);
    
    if (!err.message.includes('Unauthenticated') && !err.message.includes('401')) {
      alert(err.message || 'Failed to delete bank account. Please try again.');
    }
  }
};

// Reset form
const resetForm = () => {
  formData.value = {
    bank_name: '',
    bank_address: '',
    bank_state_province: '',
    bank_zip_code: '',
    country: '',
    iban: '',
    swift_code: '',
    beneficiary_first_name: '',
    beneficiary_last_name: '',
    beneficiary_address: '',
    beneficiary_country: '',
    beneficiary_state_province: '',
    beneficiary_zip_code: '',
    document_type: 'bank_statement',
    document: null,
  };
  selectedFile.value = null;
  validationErrors.value = {};
  
  const fileInput = document.getElementById('documentInput');
  if (fileInput) fileInput.value = '';
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
  { key: 'bank_name', label: 'Bank Name' },
  { key: 'iban', label: 'IBAN' },
  { key: 'swift_code', label: 'SWIFT Code' },
  { key: 'country', label: 'Country' },
  { key: 'beneficiary_name', label: 'Beneficiary Name' },
  { key: 'document', label: 'Document' },
  { key: 'actions', label: 'Actions' }
];

onMounted(() => {
  loadBankAccounts();
});
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 text-dark fw-bold">
        Your Bank Account
      </h5>
      <ArgonButton
        color="success"
        variant="gradient"
        size="sm"
        @click="openAddModal"
      >
        <i class="fas fa-plus me-1"></i>
        Add Bank Account
      </ArgonButton>
    </div>

    <!-- Bank Accounts Table -->
    <Table
      :columns="tableColumns"
      :data="bankAccounts"
      :loading="loading"
      loading-text="Loading bank accounts..."
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
          <i class="fas fa-file-pdf me-1"></i>
          View Document
        </a>
        <span v-else>—</span>
      </template>

      <template #cell-actions="{ row }">
        <button
          class="btn btn-sm btn-outline-danger"
          @click="deleteBankAccount(row.id)"
          title="Delete Account"
        >
          <i class="fas fa-trash"></i>
        </button>
      </template>
    </Table>

    <!-- Add Bank Account Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAddModal"
          class="modal-overlay"
          @click.self="closeAddModal"
        >
          <div class="modal-container modal-xl-container" @click.stop>
            <button class="modal-close" @click="closeAddModal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div class="modal-header-content">
              <h5 class="modal-title text-dark fw-bold">
                <i class="fas fa-university me-2"></i>
                Add Bank Account
              </h5>
            </div>
            <div class="modal-body-content">
            <form @submit.prevent="addBankAccount">
              <h6 class="text-dark fw-bold mb-3">
                <i class="fas fa-building me-2"></i>
                Bank Information
              </h6>
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label text-sm fw-semibold">Bank Name *</label>
                  <ArgonInput
                    v-model="formData.bank_name"
                    type="text"
                    placeholder="Enter bank name"
                    :class="{ 'is-invalid': hasError('bank_name') }"
                    required
                  />
                  <div v-if="hasError('bank_name')" class="invalid-feedback d-block">
                    {{ getError('bank_name') }}
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label text-sm fw-semibold">Bank Address</label>
                  <ArgonInput
                    v-model="formData.bank_address"
                    type="text"
                    placeholder="Enter bank address"
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label text-sm fw-semibold">Country</label>
                  <ArgonInput
                    v-model="formData.country"
                    type="text"
                    placeholder="Enter country"
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label text-sm fw-semibold">State/Province</label>
                  <ArgonInput
                    v-model="formData.bank_state_province"
                    type="text"
                    placeholder="Enter state/province"
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label text-sm fw-semibold">ZIP Code</label>
                  <ArgonInput
                    v-model="formData.bank_zip_code"
                    type="text"
                    placeholder="Enter ZIP code"
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label text-sm fw-semibold">IBAN</label>
                  <ArgonInput
                    v-model="formData.iban"
                    type="text"
                    placeholder="Enter IBAN"
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label text-sm fw-semibold">SWIFT Code</label>
                  <ArgonInput
                    v-model="formData.swift_code"
                    type="text"
                    placeholder="Enter SWIFT code"
                  />
                </div>
              </div>

              <h6 class="text-dark fw-bold mb-3">
                <i class="fas fa-user me-2"></i>
                Beneficiary Information
              </h6>
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label text-sm fw-semibold">First Name *</label>
                  <ArgonInput
                    v-model="formData.beneficiary_first_name"
                    type="text"
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label text-sm fw-semibold">Last Name *</label>
                  <ArgonInput
                    v-model="formData.beneficiary_last_name"
                    type="text"
                    placeholder="Enter last name"
                    required
                  />
                </div>

                <div class="col-12">
                  <label class="form-label text-sm fw-semibold">Address</label>
                  <ArgonInput
                    v-model="formData.beneficiary_address"
                    type="text"
                    placeholder="Enter beneficiary address"
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label text-sm fw-semibold">Country</label>
                  <ArgonInput
                    v-model="formData.beneficiary_country"
                    type="text"
                    placeholder="Enter country"
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label text-sm fw-semibold">State/Province</label>
                  <ArgonInput
                    v-model="formData.beneficiary_state_province"
                    type="text"
                    placeholder="Enter state/province"
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label text-sm fw-semibold">ZIP Code</label>
                  <ArgonInput
                    v-model="formData.beneficiary_zip_code"
                    type="text"
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>

              <h6 class="text-dark fw-bold mb-3">
                <i class="fas fa-file-upload me-2"></i>
                Document Upload
              </h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label text-sm fw-semibold">Document Type *</label>
                  <select
                    v-model="formData.document_type"
                    class="form-select"
                    required
                  >
                    <option value="bank_statement">Bank Statement</option>
                    <option value="void_cheque">Void Cheque</option>
                    <option value="bank_letter">Bank Letter</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label text-sm fw-semibold">Upload Document *</label>
                  <input
                    id="documentInput"
                    type="file"
                    class="form-control"
                    accept=".pdf,.jpg,.jpeg,.png"
                    @change="handleFileChange"
                    required
                  />
                  <small class="text-muted">PDF, JPG, PNG (Max 5MB)</small>
                </div>

                <div v-if="selectedFile" class="col-12">
                  <div class="alert alert-info mb-0">
                    <i class="fas fa-file me-2"></i>
                    Selected: {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(2) }} KB)
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
                @click="addBankAccount"
                :disabled="submitting"
              >
                <i v-if="submitting" class="fas fa-spinner fa-spin me-1"></i>
                <i v-else class="fas fa-save me-1"></i>
                {{ submitting ? 'Saving...' : 'Save Account' }}
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

.modal-xl-container {
  max-width: 1140px;
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

