<script setup>
import { ref, onMounted } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import AccountTypeModal from './components/AccountTypeModal.vue';
import LeverageModal from './components/LeverageModal.vue';
import { apiGet, apiDelete } from '@/utils/api.js';

// State
const accountTypes = ref([]);
const loading = ref(false);
const showModal = ref(false);
const editingAccountType = ref(null);

// Leverages state
const leverages = ref([]);
const loadingLeverages = ref(false);
const showLeverageModal = ref(false);
const editingLeverage = ref(null);

// Load account types
const loadAccountTypes = async () => {
  loading.value = true;

  try {
    // Load all account types without pagination
    const response = await apiGet('/admin/account-types');
    const data = await response.json().catch(() => null);

    if (data?.success && data?.data?.account_types) {
      const accountTypesData = data.data.account_types;
      // Handle both paginated and non-paginated responses
      if (Array.isArray(accountTypesData.data)) {
        accountTypes.value = accountTypesData.data;
      } else if (Array.isArray(accountTypesData)) {
        accountTypes.value = accountTypesData;
      } else {
        accountTypes.value = [];
      }
    } else {
      accountTypes.value = [];
    }
  } catch (err) {
    console.error('Error loading account types:', err);
    accountTypes.value = [];
  } finally {
    loading.value = false;
  }
};

// Handle create
const handleCreate = () => {
  editingAccountType.value = null;
  showModal.value = true;
};

// Handle edit
const handleEdit = (accountType) => {
  editingAccountType.value = { ...accountType };
  showModal.value = true;
};

// Handle delete
const handleDelete = async (accountType) => {
  if (!confirm(`Are you sure you want to delete "${accountType.name}"?`)) {
    return;
  }

  try {
    const response = await apiDelete(`/admin/account-types/${accountType.id}`);
    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      alert(data.message || 'Account type deleted successfully.');
      loadAccountTypes();
    } else {
      alert(data?.message || 'Failed to delete account type.');
    }
  } catch (err) {
    console.error('Error deleting account type:', err);
    alert('Failed to delete account type.');
  }
};

// Handle modal close
const handleModalClose = () => {
  showModal.value = false;
  editingAccountType.value = null;
};

// Handle account type updated
const handleAccountTypeUpdated = () => {
  loadAccountTypes();
  handleModalClose();
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
};

// Load leverages
const loadLeverages = async () => {
  loadingLeverages.value = true;

  try {
    // Load all leverages without pagination
    const response = await apiGet('/admin/leverages');
    const data = await response.json().catch(() => null);

    if (data?.success && data?.data?.leverages) {
      const leveragesData = data.data.leverages;
      // Handle both paginated and non-paginated responses
      if (Array.isArray(leveragesData.data)) {
        leverages.value = leveragesData.data;
      } else if (Array.isArray(leveragesData)) {
        leverages.value = leveragesData;
      } else {
        leverages.value = [];
      }
    } else {
      leverages.value = [];
    }
  } catch (err) {
    console.error('Error loading leverages:', err);
    leverages.value = [];
  } finally {
    loadingLeverages.value = false;
  }
};

// Handle create leverage
const handleCreateLeverage = () => {
  editingLeverage.value = null;
  showLeverageModal.value = true;
};

// Handle edit leverage
const handleEditLeverage = (leverage) => {
  editingLeverage.value = { ...leverage };
  showLeverageModal.value = true;
};

// Handle delete leverage
const handleDeleteLeverage = async (leverage) => {
  if (!confirm(`Are you sure you want to delete "${leverage.name}"?`)) {
    return;
  }

  try {
    const response = await apiDelete(`/admin/leverages/${leverage.id}`);
    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      alert(data.message || 'Leverage deleted successfully.');
      loadLeverages();
    } else {
      alert(data?.message || 'Failed to delete leverage.');
    }
  } catch (err) {
    console.error('Error deleting leverage:', err);
    alert('Failed to delete leverage.');
  }
};

// Handle leverage modal close
const handleLeverageModalClose = () => {
  showLeverageModal.value = false;
  editingLeverage.value = null;
};

// Handle leverage updated
const handleLeverageUpdated = () => {
  loadLeverages();
  handleLeverageModalClose();
};

onMounted(() => {
  loadAccountTypes();
  loadLeverages();
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h4 class="mb-0 text-dark fw-bold page-title">
            <i class="fas fa-credit-card me-2"></i>
            Account Types
          </h4>
          <ArgonButton
            color="success"
            variant="gradient"
            size="sm"
            class="add-btn"
            @click="handleCreate"
          >
            <i class="fas fa-plus me-1"></i>
            <span class="btn-text">Add Account Type</span>
          </ArgonButton>
        </div>

        <!-- Table -->
        <div v-if="loading" class="text-center text-muted py-5">
          <i class="fas fa-spinner fa-spin me-2"></i>
          Loading account types...
        </div>

        <div v-else-if="accountTypes.length === 0" class="text-center text-muted py-5">
          <i class="fas fa-credit-card fa-2x mb-3 opacity-50"></i>
          <p class="mb-0">No account types found.</p>
        </div>

        <!-- Desktop Table View -->
        <div v-else class="table-responsive d-none d-md-block">
          <table class="table align-items-center mb-0" style="background-color: white;">
            <thead>
              <tr>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Name
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Group
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Description
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Status
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Created At
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem; width: 200px;">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="accountType in accountTypes" :key="accountType.id">
                <td class="text-sm text-dark fw-bold" style="padding: 0.75rem;">
                  {{ accountType.name }}
                </td>
                <td class="text-sm text-dark" style="padding: 0.75rem;">
                  {{ accountType.group }}
                </td>
                <td class="text-sm text-dark" style="padding: 0.75rem; max-width: 300px;">
                  <div
                    v-html="accountType.description"
                    style="max-height: 100px; overflow: hidden; text-overflow: ellipsis;"
                  ></div>
                </td>
                <td style="padding: 0.75rem;">
                  <span
                    class="badge"
                    :class="accountType.is_active ? 'bg-success' : 'bg-secondary'"
                  >
                    {{ accountType.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-sm text-dark" style="padding: 0.75rem;">
                  {{ formatDate(accountType.created_at) }}
                </td>
                <td style="padding: 0.75rem;">
                  <div class="d-flex gap-2">
                    <ArgonButton
                      color="info"
                      variant="outline"
                      size="sm"
                      @click="handleEdit(accountType)"
                    >
                      <i class="fas fa-edit me-1"></i>
                      Edit
                    </ArgonButton>
                    <ArgonButton
                      color="danger"
                      variant="outline"
                      size="sm"
                      @click="handleDelete(accountType)"
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

        <!-- Mobile Card View -->
        <div v-if="!loading && accountTypes.length > 0" class="d-md-none">
          <div v-for="accountType in accountTypes" :key="accountType.id" class="card mb-3 border">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 class="mb-1 fw-bold text-dark">{{ accountType.name }}</h6>
                </div>
                <span
                  class="badge"
                  :class="accountType.is_active ? 'bg-success' : 'bg-secondary'"
                >
                  {{ accountType.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
              
              <div class="mb-2">
                <small class="text-muted d-block mb-1">Group:</small>
                <span class="text-dark">{{ accountType.group }}</span>
              </div>
              
              <div class="mb-2" v-if="accountType.description">
                <small class="text-muted d-block mb-1">Description:</small>
                <div
                  v-html="accountType.description"
                  class="text-dark"
                  style="font-size: 0.875rem; max-height: 150px; overflow-y: auto;"
                ></div>
              </div>
              
              <div class="mb-3">
                <small class="text-muted d-block mb-1">Created:</small>
                <span class="text-dark" style="font-size: 0.875rem;">{{ formatDate(accountType.created_at) }}</span>
              </div>
              
              <div class="d-flex gap-2">
                <ArgonButton
                  color="info"
                  variant="outline"
                  size="sm"
                  class="flex-fill"
                  @click="handleEdit(accountType)"
                >
                  <i class="fas fa-edit me-1"></i>
                  Edit
                </ArgonButton>
                <ArgonButton
                  color="danger"
                  variant="outline"
                  size="sm"
                  class="flex-fill"
                  @click="handleDelete(accountType)"
                >
                  <i class="fas fa-trash me-1"></i>
                  Delete
                </ArgonButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Leverages Section -->
    <div class="card border-0 shadow-sm mt-4">
      <div class="card-body p-4">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h4 class="mb-0 text-dark fw-bold page-title">
            <i class="fas fa-chart-line me-2"></i>
            Leverages
          </h4>
          <ArgonButton
            color="success"
            variant="gradient"
            size="sm"
            class="add-btn"
            @click="handleCreateLeverage"
          >
            <i class="fas fa-plus me-1"></i>
            <span class="btn-text">Add Leverage</span>
          </ArgonButton>
        </div>

        <!-- Desktop Table View -->
        <div v-if="loadingLeverages" class="text-center text-muted py-5">
          <i class="fas fa-spinner fa-spin me-2"></i>
          Loading leverages...
        </div>

        <div v-else-if="leverages.length === 0" class="text-center text-muted py-5">
          <i class="fas fa-chart-line fa-2x mb-3 opacity-50"></i>
          <p class="mb-0">No leverages found.</p>
        </div>

        <!-- Desktop Table View -->
        <div v-else class="table-responsive d-none d-md-block">
          <table class="table align-items-center mb-0" style="background-color: white;">
            <thead>
              <tr>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Name
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Value
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Status
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                  Created At
                </th>
                <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem; width: 200px;">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="leverage in leverages" :key="leverage.id">
                <td class="text-sm text-dark fw-bold" style="padding: 0.75rem;">
                  {{ leverage.name }}
                </td>
                <td class="text-sm text-dark" style="padding: 0.75rem;">
                  {{ leverage.value }}
                </td>
                <td style="padding: 0.75rem;">
                  <span
                    class="badge"
                    :class="leverage.is_active ? 'bg-success' : 'bg-secondary'"
                  >
                    {{ leverage.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-sm text-dark" style="padding: 0.75rem;">
                  {{ formatDate(leverage.created_at) }}
                </td>
                <td style="padding: 0.75rem;">
                  <div class="d-flex gap-2">
                    <ArgonButton
                      color="info"
                      variant="outline"
                      size="sm"
                      @click="handleEditLeverage(leverage)"
                    >
                      <i class="fas fa-edit me-1"></i>
                      Edit
                    </ArgonButton>
                    <ArgonButton
                      color="danger"
                      variant="outline"
                      size="sm"
                      @click="handleDeleteLeverage(leverage)"
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

        <!-- Mobile Card View -->
        <div v-if="!loadingLeverages && leverages.length > 0" class="d-md-none">
          <div v-for="leverage in leverages" :key="leverage.id" class="card mb-3 border">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 class="mb-1 fw-bold text-dark">{{ leverage.name }}</h6>
                </div>
                <span
                  class="badge"
                  :class="leverage.is_active ? 'bg-success' : 'bg-secondary'"
                >
                  {{ leverage.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
              
              <div class="mb-2">
                <small class="text-muted d-block mb-1">Value:</small>
                <span class="text-dark">{{ leverage.value }}</span>
              </div>
              
              <div class="mb-3">
                <small class="text-muted d-block mb-1">Created:</small>
                <span class="text-dark" style="font-size: 0.875rem;">{{ formatDate(leverage.created_at) }}</span>
              </div>
              
              <div class="d-flex gap-2">
                <ArgonButton
                  color="info"
                  variant="outline"
                  size="sm"
                  class="flex-fill"
                  @click="handleEditLeverage(leverage)"
                >
                  <i class="fas fa-edit me-1"></i>
                  Edit
                </ArgonButton>
                <ArgonButton
                  color="danger"
                  variant="outline"
                  size="sm"
                  class="flex-fill"
                  @click="handleDeleteLeverage(leverage)"
                >
                  <i class="fas fa-trash me-1"></i>
                  Delete
                </ArgonButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Account Type Modal -->
    <AccountTypeModal
      v-model:show="showModal"
      :account-type="editingAccountType"
      @account-type-updated="handleAccountTypeUpdated"
      @close="handleModalClose"
    />

    <!-- Leverage Modal -->
    <LeverageModal
      v-model:show="showLeverageModal"
      :leverage="editingLeverage"
      @leverage-updated="handleLeverageUpdated"
      @close="handleLeverageModalClose"
    />
  </div>
</template>

<style scoped>
.text-xxs {
  font-size: 0.75rem;
}

.card {
  background-color: white;
  border-radius: 0.5rem;
}

.table {
  margin-bottom: 0;
}

.table thead th {
  border-bottom: 1px solid #e9ecef;
  background-color: white;
}

.table tbody tr {
  border-bottom: 1px solid #f0f0f0;
}

.table tbody tr:last-child {
  border-bottom: none;
}

.table tbody tr:hover {
  background-color: #f8f9fa;
}

/* Responsive Styles */
.page-title {
  font-size: 1.5rem;
}

.add-btn {
  white-space: nowrap;
}

/* Mobile Styles */
@media (max-width: 767.98px) {
  .page-title {
    font-size: 1.25rem;
  }
  
  .page-title i {
    font-size: 1rem;
  }
  
  .add-btn {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }
  
  .btn-text {
    display: none;
  }
  
  .add-btn i {
    margin-right: 0 !important;
  }
  
  .card-body {
    padding: 0.75rem !important;
  }
}

@media (max-width: 575.98px) {
  .page-title {
    font-size: 1.1rem;
  }
  
  .card-body {
    padding: 0.5rem !important;
  }
  
  .card-body h6 {
    font-size: 0.9rem;
  }
  
  .card-body small {
    font-size: 0.75rem;
  }
}
</style>

