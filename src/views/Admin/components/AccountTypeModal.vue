<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import ArgonInput from '@/components/ArgonInput.vue';
import { apiPost, apiPut } from '@/utils/api.js';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  accountType: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:show', 'account-type-updated', 'close']);

// State
const formData = ref({
  name: '',
  group: '',
  description: '',
  is_active: true,
});

const submitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const quillEditor = ref(null);
let quillInstance = null;
let isDestroying = false;

// Computed
const formMode = computed(() => (props.accountType ? 'edit' : 'create'));
const modalTitle = computed(() => (formMode.value === 'create' ? 'Create Account Type' : 'Edit Account Type'));

// Destroy Quill instance
const destroyQuill = () => {
  if (isDestroying) return; // Prevent multiple simultaneous destructions
  if (!quillInstance) return; // Already destroyed
  
  isDestroying = true;
  try {
    // Remove event listeners if they exist
    if (quillInstance && quillInstance.off) {
      quillInstance.off('text-change');
    }
    // Clear the editor content only if root exists
    if (quillInstance && quillInstance.root) {
      try {
        quillInstance.root.innerHTML = '';
      } catch (e) {
        // Ignore errors when clearing content
      }
    }
  } catch (error) {
    // Ignore errors during cleanup
  } finally {
    // Always set to null
    quillInstance = null;
    isDestroying = false;
  }
};

// Initialize Quill editor
const initQuill = async () => {
  // Wait for DOM to be ready
  await nextTick();
  
  // Check if element exists
  if (!quillEditor.value) {
    console.warn('Quill editor element not found');
    return;
  }

  // Destroy existing instance if any
  destroyQuill();

  try {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['link'],
          ['clean'],
        ],
      },
    });

    // Set initial content if available
    if (formData.value.description && quillInstance && quillInstance.root) {
      quillInstance.root.innerHTML = formData.value.description;
    }

    // Listen for text changes
    if (quillInstance) {
      const textChangeHandler = () => {
        // Only update if not destroying and instance still exists
        if (!isDestroying && quillInstance && quillInstance.root) {
          try {
            formData.value.description = quillInstance.root.innerHTML;
          } catch (error) {
            // Ignore errors when reading content
          }
        }
      };
      quillInstance.on('text-change', textChangeHandler);
    }
  } catch (error) {
    console.error('Error initializing Quill:', error);
    quillInstance = null;
  }
};

// Watch for modal show/hide
watch(() => props.show, async (newVal) => {
  if (newVal) {
    // Reset form first
    formData.value = {
      name: '',
      group: '',
      description: '',
      is_active: true,
    };
    errorMessage.value = '';
    successMessage.value = '';

    // Load account type data if editing
    if (props.accountType) {
      formData.value = {
        name: props.accountType.name || '',
        group: props.accountType.group || '',
        description: props.accountType.description || '',
        is_active: props.accountType.is_active !== undefined ? props.accountType.is_active : true,
      };
    }

    // Initialize Quill after DOM update
    await nextTick();
    setTimeout(() => {
      initQuill();
    }, 200);
  } else {
    // Clean up Quill instance when modal closes
    destroyQuill();
  }
});

// Reset form
const resetForm = () => {
  formData.value = {
    name: '',
    group: '',
    description: '',
    is_active: true,
  };
  errorMessage.value = '';
  successMessage.value = '';
  // Don't access quillInstance here - it may be null
};

// Close modal
const closeModal = () => {
  // Destroy Quill first before emitting events
  destroyQuill();
  // Reset form data
  resetForm();
  // Emit events to close modal
  emit('update:show', false);
  emit('close');
};

// Submit form
const submitForm = async () => {
  // Validation
  if (!formData.value.name.trim()) {
    errorMessage.value = 'Name is required.';
    return;
  }

  if (!formData.value.group.trim()) {
    errorMessage.value = 'Group is required.';
    return;
  }

  // Get description from Quill
  if (quillInstance && quillInstance.root) {
    formData.value.description = quillInstance.root.innerHTML;
  }

  submitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const payload = {
      name: formData.value.name.trim(),
      group: formData.value.group.trim(),
      description: formData.value.description,
      is_active: formData.value.is_active ? 1 : 0,
    };

    let response;
    if (formMode.value === 'create') {
      response = await apiPost('/admin/account-types', payload);
    } else {
      response = await apiPut(`/admin/account-types/${props.accountType.id}`, payload);
    }

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      successMessage.value = data.message || (formMode.value === 'create' ? 'Account type created successfully.' : 'Account type updated successfully.');
      setTimeout(() => {
        emit('account-type-updated');
        closeModal();
      }, 1000);
    } else {
      errorMessage.value = data?.message || `Failed to ${formMode.value === 'create' ? 'create' : 'update'} account type.`;
    }
  } catch (err) {
    console.error(`Error ${formMode.value === 'create' ? 'creating' : 'updating'} account type:`, err);
    errorMessage.value = `Failed to ${formMode.value === 'create' ? 'create' : 'update'} account type.`;
  } finally {
    submitting.value = false;
  }
};

onUnmounted(() => {
  destroyQuill();
});
</script>

<template>
  <div
    v-if="show"
    class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
    style="background-color: rgba(0, 0, 0, 0.5); z-index: 1050;"
    @click.self="closeModal"
  >
    <div
      class="bg-white rounded-3 shadow-lg"
      style="width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto;"
      @click.stop
    >
      <!-- Header -->
      <div class="p-4 border-bottom">
        <div class="d-flex justify-content-between align-items-center">
          <h4 class="mb-0 fw-bold">{{ modalTitle }}</h4>
          <button
            type="button"
            class="btn btn-link text-dark p-0"
            @click="closeModal"
            style="font-size: 1.5rem; line-height: 1;"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-4">
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

        <!-- Form -->
        <form @submit.prevent="submitForm">
          <!-- Name -->
          <div class="mb-3">
            <label class="form-label text-sm fw-bold mb-1">
              Name <span class="text-danger">*</span>
            </label>
            <ArgonInput
              v-model="formData.name"
              type="text"
              placeholder="Enter account type name"
              :isRequired="true"
            />
          </div>

          <!-- Group -->
          <div class="mb-3">
            <label class="form-label text-sm fw-bold mb-1">
              Group <span class="text-danger">*</span>
            </label>
            <ArgonInput
              v-model="formData.group"
              type="text"
              placeholder="Enter group (e.g., demo\\Pro)"
              :isRequired="true"
            />
          </div>

          <!-- Description (Quill Editor) -->
          <div class="mb-3">
            <label class="form-label text-sm fw-bold mb-1">
              Description
            </label>
            <div ref="quillEditor" style="min-height: 200px;"></div>
          </div>

          <!-- Is Active -->
          <div class="mb-3">
            <div class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                id="isActive"
                v-model="formData.is_active"
              />
              <label class="form-check-label text-sm" for="isActive">
                Active
              </label>
            </div>
          </div>

          <!-- Actions -->
          <div class="d-flex justify-content-end gap-2 mt-4">
            <ArgonButton
              type="button"
              color="secondary"
              variant="outline"
              @click="closeModal"
              :disabled="submitting"
            >
              Cancel
            </ArgonButton>
            <ArgonButton
              type="submit"
              color="success"
              variant="gradient"
              :disabled="submitting"
            >
              <i v-if="submitting" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-save me-1"></i>
              {{ submitting ? 'Saving...' : (formMode === 'create' ? 'Create' : 'Update') }}
            </ArgonButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Quill editor styles */
:deep(.ql-container) {
  font-size: 14px;
  min-height: 200px;
}

:deep(.ql-editor) {
  min-height: 200px;
}

:deep(.ql-toolbar) {
  border-top-left-radius: 0.375rem;
  border-top-right-radius: 0.375rem;
  border-bottom: 1px solid #e9ecef;
}

:deep(.ql-container) {
  border-bottom-left-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}
</style>

