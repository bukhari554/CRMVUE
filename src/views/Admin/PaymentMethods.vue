<script setup>
import { ref, onMounted, watch } from 'vue';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/utils/api.js';
import ArgonButton from '@/components/ArgonButton.vue';
import ArgonInput from '@/components/ArgonInput.vue';

const loading = ref(false);
const paymentMethods = ref([]);
const currentPage = ref(1);
const lastPage = ref(1);
const total = ref(0);
const filters = ref({
  type: '',
  is_active: '',
  per_page: 15,
});

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedPaymentMethod = ref(null);
const submitting = ref(false);
const validationErrors = ref({});
const selectedBarcodeFile = ref(null);

const formData = ref({
  type: 'card',
  amount: '',
  card_link: '',
  payment_method_name: '',
  network: '',
  network_address: '',
  barcode_image: null,
  is_active: true,
});

// Load payment methods
const loadPaymentMethods = async (page = 1) => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: filters.value.per_page.toString(),
    });
    
    if (filters.value.type) {
      params.append('type', filters.value.type);
    }
    if (filters.value.is_active !== '') {
      params.append('is_active', filters.value.is_active);
    }

    const response = await apiGet(`/admin/payment-methods?${params.toString()}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.data?.payment_methods) {
        paymentMethods.value = data.data.payment_methods.data || [];
        currentPage.value = data.data.payment_methods.current_page || 1;
        lastPage.value = data.data.payment_methods.last_page || 1;
        total.value = data.data.payment_methods.total || 0;
      }
    }
  } catch (err) {
    console.error('Error loading payment methods:', err);
  } finally {
    loading.value = false;
  }
};

// Handle file selection
const handleBarcodeFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPEG, JPG, PNG, or GIF file only.');
      event.target.value = '';
      selectedBarcodeFile.value = null;
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should not exceed 10MB.');
      event.target.value = '';
      selectedBarcodeFile.value = null;
      return;
    }
    
    selectedBarcodeFile.value = file;
    formData.value.barcode_image = file;
  }
};

// Watch type change to reset form fields
watch(() => formData.value.type, () => {
  if (formData.value.type === 'card') {
    formData.value.payment_method_name = '';
    formData.value.network = '';
    formData.value.network_address = '';
    formData.value.barcode_image = null;
    selectedBarcodeFile.value = null;
  } else {
    formData.value.amount = '';
    formData.value.card_link = '';
  }
});

// Open add modal
const openAddModal = () => {
  resetForm();
  showAddModal.value = true;
};

// Close add modal
const closeAddModal = () => {
  showAddModal.value = false;
  resetForm();
};

// Open edit modal
const openEditModal = (paymentMethod) => {
  selectedPaymentMethod.value = paymentMethod;
  formData.value = {
    type: paymentMethod.type,
    amount: paymentMethod.amount || '',
    card_link: paymentMethod.card_link || '',
    payment_method_name: paymentMethod.payment_method_name || '',
    network: paymentMethod.network || '',
    network_address: paymentMethod.network_address || '',
    barcode_image: null,
    is_active: paymentMethod.is_active,
  };
  selectedBarcodeFile.value = null;
  validationErrors.value = {};
  showEditModal.value = true;
};

// Close edit modal
const closeEditModal = () => {
  showEditModal.value = false;
  selectedPaymentMethod.value = null;
  resetForm();
};

// Open delete modal
const openDeleteModal = (paymentMethod) => {
  selectedPaymentMethod.value = paymentMethod;
  showDeleteModal.value = true;
};

// Close delete modal
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedPaymentMethod.value = null;
};

// Reset form
const resetForm = () => {
  formData.value = {
    type: 'card',
    amount: '',
    card_link: '',
    payment_method_name: '',
    network: '',
    network_address: '',
    barcode_image: null,
    is_active: true,
  };
  selectedBarcodeFile.value = null;
  validationErrors.value = {};
  
  const fileInput = document.getElementById('barcodeImageInput');
  if (fileInput) fileInput.value = '';
};

// Create payment method
const createPaymentMethod = async () => {
  submitting.value = true;
  validationErrors.value = {};
  
  try {
    const formDataToSend = new FormData();
    formDataToSend.append('type', formData.value.type);
    formDataToSend.append('is_active', formData.value.is_active ? '1' : '0');
    
    if (formData.value.type === 'card') {
      if (!formData.value.amount || !formData.value.card_link) {
        alert('Amount and Card Link are required for card type.');
        submitting.value = false;
        return;
      }
      formDataToSend.append('amount', formData.value.amount);
      formDataToSend.append('card_link', formData.value.card_link);
    } else {
      if (!formData.value.payment_method_name || !formData.value.network || !formData.value.network_address) {
        alert('Payment Method Name, Network, and Network Address are required for other type.');
        submitting.value = false;
        return;
      }
      formDataToSend.append('payment_method_name', formData.value.payment_method_name);
      formDataToSend.append('network', formData.value.network);
      formDataToSend.append('network_address', formData.value.network_address);
      if (selectedBarcodeFile.value) {
        formDataToSend.append('barcode_image', selectedBarcodeFile.value);
      }
    }

    const response = await apiPost('/admin/payment-methods', formDataToSend);
    
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

    if (data && data.success) {
      alert(data.message || 'Payment method created successfully!');
      closeAddModal();
      loadPaymentMethods(currentPage.value);
    }

  } catch (err) {
    console.error('Error creating payment method:', err);
    alert(err.message || 'Failed to create payment method. Please try again.');
  } finally {
    submitting.value = false;
  }
};

// Update payment method
const updatePaymentMethod = async () => {
  if (!selectedPaymentMethod.value) return;

  submitting.value = true;
  validationErrors.value = {};
  
  try {
    const formDataToSend = new FormData();
    
    // Only send fields that have changed or are required
    if (formData.value.type !== selectedPaymentMethod.value.type) {
      formDataToSend.append('type', formData.value.type);
    }
    
    formDataToSend.append('is_active', formData.value.is_active ? '1' : '0');
    
    if (formData.value.type === 'card') {
      if (formData.value.amount) {
        formDataToSend.append('amount', formData.value.amount);
      }
      if (formData.value.card_link) {
        formDataToSend.append('card_link', formData.value.card_link);
      }
    } else {
      if (formData.value.payment_method_name) {
        formDataToSend.append('payment_method_name', formData.value.payment_method_name);
      }
      if (formData.value.network) {
        formDataToSend.append('network', formData.value.network);
      }
      if (formData.value.network_address) {
        formDataToSend.append('network_address', formData.value.network_address);
      }
      if (selectedBarcodeFile.value) {
        formDataToSend.append('barcode_image', selectedBarcodeFile.value);
      }
    }

    const response = await apiPatch(`/admin/payment-methods/${selectedPaymentMethod.value.id}`, formDataToSend);
    
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

    if (data && data.success) {
      alert(data.message || 'Payment method updated successfully!');
      closeEditModal();
      loadPaymentMethods(currentPage.value);
    }

  } catch (err) {
    console.error('Error updating payment method:', err);
    alert(err.message || 'Failed to update payment method. Please try again.');
  } finally {
    submitting.value = false;
  }
};

// Delete payment method
const deletePaymentMethod = async () => {
  if (!selectedPaymentMethod.value) return;

  submitting.value = true;
  try {
    const response = await apiDelete(`/admin/payment-methods/${selectedPaymentMethod.value.id}`);
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    if (data && data.success) {
      alert(data.message || 'Payment method deleted successfully!');
      closeDeleteModal();
      loadPaymentMethods(currentPage.value);
    }

  } catch (err) {
    console.error('Error deleting payment method:', err);
    alert(err.message || 'Failed to delete payment method. Please try again.');
  } finally {
    submitting.value = false;
  }
};

// Apply filters
const applyFilters = () => {
  currentPage.value = 1;
  loadPaymentMethods(1);
};

// Get status badge class
const getStatusClass = (isActive) => {
  return isActive ? 'success' : 'secondary';
};

// Get type badge class
const getTypeClass = (type) => {
  return type === 'card' ? 'primary' : 'info';
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
  loadPaymentMethods();
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="mb-0 text-dark fw-bold">
            <i class="fas fa-credit-card me-2"></i>
            Payment Methods Management
          </h4>
          <ArgonButton
            color="success"
            variant="gradient"
            size="sm"
            @click="openAddModal"
          >
            <i class="fas fa-plus me-1"></i>
            Add Payment Method
          </ArgonButton>
        </div>

        <!-- Filters -->
        <div class="card border p-3 mb-4">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label text-sm fw-semibold">Type</label>
              <select v-model="filters.type" class="form-select form-select-sm">
                <option value="">All Types</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label text-sm fw-semibold">Status</label>
              <select v-model="filters.is_active" class="form-select form-select-sm">
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
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

        <!-- Payment Methods Table -->
        <div class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Details</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="text-center py-5">
                  <i class="fas fa-spinner fa-spin me-2"></i>
                  Loading payment methods...
                </td>
              </tr>
              <tr v-else-if="paymentMethods.length === 0">
                <td colspan="6" class="text-center py-5 text-muted">
                  No payment methods found.
                </td>
              </tr>
              <tr v-else v-for="method in paymentMethods" :key="method.id">
                <td>{{ method.id }}</td>
                <td>
                  <span :class="`badge bg-${getTypeClass(method.type)}`">
                    {{ method.type === 'card' ? 'Card' : 'Other' }}
                  </span>
                </td>
                <td>
                  <div v-if="method.type === 'card'">
                    <div><strong>Amount:</strong> {{ method.amount || '—' }}</div>
                    <div class="small">
                      <strong>Link:</strong> 
                      <a v-if="method.card_link" :href="method.card_link" target="_blank" class="text-decoration-none">
                        {{ method.card_link.substring(0, 50) }}{{ method.card_link.length > 50 ? '...' : '' }}
                      </a>
                      <span v-else>—</span>
                    </div>
                  </div>
                  <div v-else>
                    <div><strong>Name:</strong> {{ method.payment_method_name || '—' }}</div>
                    <div class="small"><strong>Network:</strong> {{ method.network || '—' }}</div>
                    <div class="small font-monospace"><strong>Address:</strong> {{ method.network_address ? method.network_address.substring(0, 30) + '...' : '—' }}</div>
                  </div>
                </td>
                <td>
                  <span :class="`badge bg-${getStatusClass(method.is_active)}`">
                    {{ method.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="small">{{ new Date(method.created_at).toLocaleDateString() }}</td>
                <td>
                  <div class="btn-group" role="group">
                    <ArgonButton
                      color="info"
                      variant="outline"
                      size="sm"
                      @click="openEditModal(method)"
                    >
                      <i class="fas fa-edit me-1"></i>
                      Edit
                    </ArgonButton>
                    <ArgonButton
                      color="danger"
                      variant="outline"
                      size="sm"
                      @click="openDeleteModal(method)"
                    >
                      <i class="fas fa-trash me-1"></i>
                      Delete
                    </ArgonButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="lastPage > 1" class="d-flex justify-content-between align-items-center mt-3">
          <div class="text-muted small">
            Showing {{ (currentPage - 1) * filters.per_page + 1 }} to {{ Math.min(currentPage * filters.per_page, total) }} of {{ total }} payment methods
          </div>
          <div>
            <button
              class="btn btn-sm btn-outline-secondary me-2"
              :disabled="currentPage === 1"
              @click="loadPaymentMethods(currentPage - 1)"
            >
              <i class="fas fa-chevron-left"></i> Previous
            </button>
            <button
              class="btn btn-sm btn-outline-secondary"
              :disabled="currentPage === lastPage"
              @click="loadPaymentMethods(currentPage + 1)"
            >
              Next <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div
      v-if="showAddModal"
      class="modal fade show d-block"
      style="background-color: rgba(0, 0, 0, 0.5);"
      tabindex="-1"
      @click.self="closeAddModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header border-bottom">
            <h5 class="modal-title text-dark fw-bold">Add Payment Method</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeAddModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createPaymentMethod">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label fw-semibold">Type *</label>
                  <select
                    v-model="formData.type"
                    class="form-select"
                    :class="{ 'is-invalid': hasError('type') }"
                    required
                  >
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                  <div v-if="hasError('type')" class="invalid-feedback d-block">
                    {{ getError('type') }}
                  </div>
                </div>

                <!-- Card Type Fields -->
                <template v-if="formData.type === 'card'">
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Amount *</label>
                    <ArgonInput
                      v-model="formData.amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Enter amount"
                      :class="{ 'is-invalid': hasError('amount') }"
                      required
                    />
                    <div v-if="hasError('amount')" class="invalid-feedback d-block">
                      {{ getError('amount') }}
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Card Link *</label>
                    <ArgonInput
                      v-model="formData.card_link"
                      type="url"
                      placeholder="Enter card link URL"
                      :class="{ 'is-invalid': hasError('card_link') }"
                      required
                    />
                    <div v-if="hasError('card_link')" class="invalid-feedback d-block">
                      {{ getError('card_link') }}
                    </div>
                  </div>
                </template>

                <!-- Other Type Fields -->
                <template v-else>
                  <div class="col-12">
                    <label class="form-label fw-semibold">Payment Method Name *</label>
                    <ArgonInput
                      v-model="formData.payment_method_name"
                      type="text"
                      placeholder="Enter payment method name"
                      :class="{ 'is-invalid': hasError('payment_method_name') }"
                      required
                    />
                    <div v-if="hasError('payment_method_name')" class="invalid-feedback d-block">
                      {{ getError('payment_method_name') }}
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Network *</label>
                    <ArgonInput
                      v-model="formData.network"
                      type="text"
                      placeholder="Enter network"
                      :class="{ 'is-invalid': hasError('network') }"
                      required
                    />
                    <div v-if="hasError('network')" class="invalid-feedback d-block">
                      {{ getError('network') }}
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Network Address *</label>
                    <ArgonInput
                      v-model="formData.network_address"
                      type="text"
                      placeholder="Enter network address"
                      :class="{ 'is-invalid': hasError('network_address') }"
                      required
                    />
                    <div v-if="hasError('network_address')" class="invalid-feedback d-block">
                      {{ getError('network_address') }}
                    </div>
                  </div>
                  <div class="col-12">
                    <label class="form-label fw-semibold">Barcode Image *</label>
                    <input
                      id="barcodeImageInput"
                      type="file"
                      class="form-control"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      @change="handleBarcodeFileChange"
                      required
                    />
                    <small class="text-muted">JPEG, JPG, PNG, GIF (Max 10MB)</small>
                    <div v-if="hasError('barcode_image')" class="invalid-feedback d-block">
                      {{ getError('barcode_image') }}
                    </div>
                  </div>
                  <div v-if="selectedBarcodeFile" class="col-12">
                    <div class="alert alert-info mb-0">
                      <i class="fas fa-file me-2"></i>
                      Selected: {{ selectedBarcodeFile.name }} ({{ (selectedBarcodeFile.size / 1024).toFixed(2) }} KB)
                    </div>
                  </div>
                </template>

                <div class="col-12">
                  <div class="form-check">
                    <input
                      v-model="formData.is_active"
                      class="form-check-input"
                      type="checkbox"
                      id="isActiveAdd"
                    />
                    <label class="form-check-label" for="isActiveAdd">
                      Active
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer border-top">
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
              @click="createPaymentMethod"
              :disabled="submitting"
            >
              <i v-if="submitting" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-save me-1"></i>
              {{ submitting ? 'Creating...' : 'Create' }}
            </ArgonButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="showEditModal"
      class="modal fade show d-block"
      style="background-color: rgba(0, 0, 0, 0.5);"
      tabindex="-1"
      @click.self="closeEditModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header border-bottom">
            <h5 class="modal-title text-dark fw-bold">Edit Payment Method</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeEditModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updatePaymentMethod">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label fw-semibold">Type *</label>
                  <select
                    v-model="formData.type"
                    class="form-select"
                    :class="{ 'is-invalid': hasError('type') }"
                    required
                  >
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                  <div v-if="hasError('type')" class="invalid-feedback d-block">
                    {{ getError('type') }}
                  </div>
                </div>

                <!-- Card Type Fields -->
                <template v-if="formData.type === 'card'">
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Amount</label>
                    <ArgonInput
                      v-model="formData.amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Enter amount"
                      :class="{ 'is-invalid': hasError('amount') }"
                    />
                    <div v-if="hasError('amount')" class="invalid-feedback d-block">
                      {{ getError('amount') }}
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Card Link</label>
                    <ArgonInput
                      v-model="formData.card_link"
                      type="url"
                      placeholder="Enter card link URL"
                      :class="{ 'is-invalid': hasError('card_link') }"
                    />
                    <div v-if="hasError('card_link')" class="invalid-feedback d-block">
                      {{ getError('card_link') }}
                    </div>
                  </div>
                </template>

                <!-- Other Type Fields -->
                <template v-else>
                  <div class="col-12">
                    <label class="form-label fw-semibold">Payment Method Name</label>
                    <ArgonInput
                      v-model="formData.payment_method_name"
                      type="text"
                      placeholder="Enter payment method name"
                      :class="{ 'is-invalid': hasError('payment_method_name') }"
                    />
                    <div v-if="hasError('payment_method_name')" class="invalid-feedback d-block">
                      {{ getError('payment_method_name') }}
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Network</label>
                    <ArgonInput
                      v-model="formData.network"
                      type="text"
                      placeholder="Enter network"
                      :class="{ 'is-invalid': hasError('network') }"
                    />
                    <div v-if="hasError('network')" class="invalid-feedback d-block">
                      {{ getError('network') }}
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Network Address</label>
                    <ArgonInput
                      v-model="formData.network_address"
                      type="text"
                      placeholder="Enter network address"
                      :class="{ 'is-invalid': hasError('network_address') }"
                    />
                    <div v-if="hasError('network_address')" class="invalid-feedback d-block">
                      {{ getError('network_address') }}
                    </div>
                  </div>
                  <div class="col-12">
                    <label class="form-label fw-semibold">Barcode Image</label>
                    <input
                      id="barcodeImageInputEdit"
                      type="file"
                      class="form-control"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      @change="handleBarcodeFileChange"
                    />
                    <small class="text-muted">JPEG, JPG, PNG, GIF (Max 10MB). Leave empty to keep current image.</small>
                    <div v-if="selectedPaymentMethod?.barcode_image_path" class="mt-2">
                      <img :src="selectedPaymentMethod.barcode_image_path" alt="Current barcode" style="max-height: 100px;" class="border rounded" />
                    </div>
                    <div v-if="hasError('barcode_image')" class="invalid-feedback d-block">
                      {{ getError('barcode_image') }}
                    </div>
                  </div>
                  <div v-if="selectedBarcodeFile" class="col-12">
                    <div class="alert alert-info mb-0">
                      <i class="fas fa-file me-2"></i>
                      Selected: {{ selectedBarcodeFile.name }} ({{ (selectedBarcodeFile.size / 1024).toFixed(2) }} KB)
                    </div>
                  </div>
                </template>

                <div class="col-12">
                  <div class="form-check">
                    <input
                      v-model="formData.is_active"
                      class="form-check-input"
                      type="checkbox"
                      id="isActiveEdit"
                    />
                    <label class="form-check-label" for="isActiveEdit">
                      Active
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer border-top">
            <ArgonButton
              color="secondary"
              variant="outline"
              size="sm"
              @click="closeEditModal"
              :disabled="submitting"
            >
              Cancel
            </ArgonButton>
            <ArgonButton
              color="success"
              variant="gradient"
              size="sm"
              @click="updatePaymentMethod"
              :disabled="submitting"
            >
              <i v-if="submitting" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-save me-1"></i>
              {{ submitting ? 'Updating...' : 'Update' }}
            </ArgonButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div
      v-if="showDeleteModal"
      class="modal fade show d-block"
      style="background-color: rgba(0, 0, 0, 0.5);"
      tabindex="-1"
      @click.self="closeDeleteModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-bottom">
            <h5 class="modal-title text-dark fw-bold">Delete Payment Method</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeDeleteModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete this payment method?</p>
            <div v-if="selectedPaymentMethod" class="alert alert-warning mb-0">
              <strong>Type:</strong> {{ selectedPaymentMethod.type === 'card' ? 'Card' : 'Other' }}<br>
              <span v-if="selectedPaymentMethod.type === 'card'">
                <strong>Amount:</strong> {{ selectedPaymentMethod.amount }}<br>
              </span>
              <span v-else>
                <strong>Name:</strong> {{ selectedPaymentMethod.payment_method_name }}<br>
              </span>
            </div>
          </div>
          <div class="modal-footer border-top">
            <ArgonButton
              color="secondary"
              variant="outline"
              size="sm"
              @click="closeDeleteModal"
              :disabled="submitting"
            >
              Cancel
            </ArgonButton>
            <ArgonButton
              color="danger"
              variant="gradient"
              size="sm"
              @click="deletePaymentMethod"
              :disabled="submitting"
            >
              <i v-if="submitting" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-trash me-1"></i>
              {{ submitting ? 'Deleting...' : 'Delete' }}
            </ArgonButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table th {
  white-space: nowrap;
  font-weight: 600;
  font-size: 0.875rem;
}
.table td {
  font-size: 0.875rem;
  vertical-align: middle;
}
.font-monospace { font-family: 'Courier New', monospace; }
.modal { display: block; }
.form-label { margin-bottom: 0.5rem; color: #344767; }
.form-select, .form-control {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d2d6da;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}
.is-invalid { border-color: #dc3545 !important; }
.invalid-feedback { color: #dc3545; font-size: 0.75rem; margin-top: 0.25rem; }
</style>
