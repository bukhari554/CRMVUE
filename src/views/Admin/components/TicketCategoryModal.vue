<script setup>
import { ref, watch, onMounted } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import ArgonInput from '@/components/ArgonInput.vue';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api.js';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:show', 'category-updated']);

const categories = ref([]);
const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Form state
const formMode = ref('create'); // 'create' or 'edit'
const formData = ref({
  id: null,
  name: '',
});

// Load categories
const loadCategories = async () => {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    console.log('📡 Fetching ticket categories from: /admin/ticket-categories');
    const response = await apiGet('/admin/ticket-categories');
    console.log('📥 Response status:', response.status, response.ok);
    
    // Check response status
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorData = null;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // Not JSON, use text
      }
      console.error('❌ API Error:', response.status, errorData || errorText);
      errorMessage.value = errorData?.message || `Failed to load categories. Status: ${response.status}`;
      categories.value = [];
      return;
    }

    const data = await response.json().catch((err) => {
      console.error('❌ Failed to parse JSON:', err);
      return null;
    });

    console.log('📦 Response data:', data);

    if (!data) {
      errorMessage.value = 'Invalid response from server.';
      categories.value = [];
      return;
    }

    // Handle different response structures
    if (data.success && data.data) {
      // Structure: { success: true, data: { categories: [...] } }
      if (data.data.categories && Array.isArray(data.data.categories)) {
        categories.value = data.data.categories;
        console.log('✅ Categories loaded (nested):', categories.value.length);
      } 
      // Structure: { success: true, data: [...] }
      else if (Array.isArray(data.data)) {
        categories.value = data.data;
        console.log('✅ Categories loaded (direct array):', categories.value.length);
      } else {
        categories.value = [];
        console.warn('⚠️ Unexpected data structure:', data.data);
        errorMessage.value = 'Categories not found in response.';
      }
    } else if (Array.isArray(data)) {
      // Structure: [...]
      categories.value = data;
      console.log('✅ Categories loaded (array):', categories.value.length);
    } else {
      console.warn('⚠️ Unexpected response structure:', data);
      categories.value = [];
      errorMessage.value = data?.message || 'Unexpected response format.';
    }
  } catch (err) {
    console.error('Error loading categories:', err);
    errorMessage.value = `Failed to load categories: ${err.message || 'Unknown error'}`;
    categories.value = [];
  } finally {
    loading.value = false;
  }
};

// Reset form
const resetForm = () => {
  formMode.value = 'create';
  formData.value = {
    id: null,
    name: '',
  };
  errorMessage.value = '';
  successMessage.value = '';
};

// Open create form
const openCreateForm = () => {
  resetForm();
  formMode.value = 'create';
};

// Open edit form
const openEditForm = (category) => {
  resetForm();
  formMode.value = 'edit';
  formData.value = {
    id: category.id,
    name: category.name || '',
  };
};

// Submit form (create or update)
const submitForm = async () => {
  if (!formData.value.name.trim()) {
    errorMessage.value = 'Category name is required.';
    return;
  }

  submitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    let response;
    const payload = { name: formData.value.name.trim() };

    if (formMode.value === 'create') {
      response = await apiPost('/admin/ticket-categories', payload);
    } else {
      response = await apiPut(`/admin/ticket-categories/${formData.value.id}`, payload);
    }

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      successMessage.value = data.message || (formMode.value === 'create' ? 'Category created successfully.' : 'Category updated successfully.');
      resetForm();
      await loadCategories();
      emit('category-updated');
    } else {
      errorMessage.value = data?.message || `Failed to ${formMode.value === 'create' ? 'create' : 'update'} category.`;
    }
  } catch (err) {
    console.error(`Error ${formMode.value === 'create' ? 'creating' : 'updating'} category:`, err);
    errorMessage.value = `Failed to ${formMode.value === 'create' ? 'create' : 'update'} category.`;
  } finally {
    submitting.value = false;
  }
};

// Delete category
const deleteCategory = async (categoryId) => {
  if (!confirm('Are you sure you want to delete this category?')) {
    return;
  }

  try {
    const response = await apiDelete(`/admin/ticket-categories/${categoryId}`);
    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      successMessage.value = data.message || 'Category deleted successfully.';
      await loadCategories();
      emit('category-updated');
    } else {
      errorMessage.value = data?.message || 'Failed to delete category.';
    }
  } catch (err) {
    console.error('Error deleting category:', err);
    errorMessage.value = 'Failed to delete category.';
  }
};

// Close modal
const closeModal = () => {
  emit('update:show', false);
  resetForm();
};

// Watch for modal show
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      loadCategories();
      resetForm();
    }
  }
);

onMounted(() => {
  if (props.show) {
    loadCategories();
  }
});
</script>

<template>
  <div
    v-if="show"
    class="modal-backdrop"
    style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
    "
    @click.self="closeModal"
  >
    <div
      class="modal-content"
      style="
        background: white;
        border-radius: 0.5rem;
        max-width: 800px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      "
      @click.stop
    >
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center p-4 border-bottom">
        <h5 class="mb-0 fw-bold text-dark">
          <i class="fas fa-tags me-2"></i>
          Ticket Categories
        </h5>
        <button
          type="button"
          class="btn btn-sm btn-link text-dark p-0"
          @click="closeModal"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Content -->
      <div class="p-4">
        <!-- Messages -->
        <div v-if="errorMessage" class="alert alert-danger mb-3">
          <i class="fas fa-exclamation-circle me-2"></i>
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="alert alert-success mb-3">
          <i class="fas fa-check-circle me-2"></i>
          {{ successMessage }}
        </div>

        <!-- Create/Edit Form -->
        <div class="card border mb-4">
          <div class="card-body">
            <h6 class="fw-bold mb-3">
              <i :class="formMode === 'create' ? 'fas fa-plus' : 'fas fa-edit'" class="me-2"></i>
              {{ formMode === 'create' ? 'Create New Category' : 'Edit Category' }}
            </h6>
            <div class="row">
              <div class="col-md-8">
                <label class="form-label text-sm mb-2">Category Name</label>
                <ArgonInput
                  v-model="formData.name"
                  type="text"
                  placeholder="Enter category name"
                  :disabled="submitting"
                />
              </div>
              <div class="col-md-4 d-flex align-items-center gap-2" style="padding-top: 1.5rem;">
                <ArgonButton
                  color="success"
                  variant="gradient"
                  @click="submitForm"
                  :disabled="submitting || !formData.name.trim()"
                >
                  <i :class="submitting ? 'fas fa-spinner fa-spin' : (formMode === 'create' ? 'fas fa-plus' : 'fas fa-save')" class="me-1"></i>
                  {{ submitting ? 'Saving...' : (formMode === 'create' ? 'Create' : 'Update') }}
                </ArgonButton>
                <ArgonButton
                  v-if="formMode === 'edit'"
                  color="secondary"
                  variant="outline"
                  @click="resetForm"
                  :disabled="submitting"
                >
                  Cancel
                </ArgonButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Categories List -->
        <div>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="fw-bold mb-0">
              <i class="fas fa-list me-2"></i>
              Categories ({{ categories.length }})
            </h6>
            <ArgonButton
              v-if="formMode === 'edit'"
              color="info"
              variant="outline"
              size="sm"
              @click="openCreateForm"
            >
              <i class="fas fa-plus me-1"></i>
              New Category
            </ArgonButton>
          </div>

          <div v-if="loading" class="text-center text-muted py-4">
            <i class="fas fa-spinner fa-spin me-2"></i>
            Loading categories...
          </div>

          <div v-else-if="categories.length === 0" class="text-center text-muted py-4">
            <i class="fas fa-tags fa-2x mb-3 opacity-50"></i>
            <p class="mb-0">No categories found.</p>
          </div>

          <div v-else class="table-responsive">
            <table class="table align-items-center mb-0" style="background-color: white;">
              <thead>
                <tr>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem;">
                    Name
                  </th>
                  <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style="padding: 0.75rem; width: 200px;">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="category in categories" :key="category.id">
                  <td class="text-sm text-dark fw-bold" style="padding: 0.75rem;">
                    {{ category.name }}
                  </td>
                  <td style="padding: 0.75rem;">
                    <div class="d-flex gap-2">
                      <ArgonButton
                        color="info"
                        variant="outline"
                        size="sm"
                        @click="openEditForm(category)"
                      >
                        <i class="fas fa-edit me-1"></i>
                        Edit
                      </ArgonButton>
                      <ArgonButton
                        color="danger"
                        variant="outline"
                        size="sm"
                        @click="deleteCategory(category.id)"
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
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-xxs {
  font-size: 0.75rem;
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
</style>

