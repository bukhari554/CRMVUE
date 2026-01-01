<script setup>
import { ref, computed, watch } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import ArgonInput from '@/components/ArgonInput.vue';
import { apiPost, apiPut } from '@/utils/api.js';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  leverage: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:show', 'leverage-updated', 'close']);

// State
const formData = ref({
  name: '',
  value: '',
  is_active: true,
});

const submitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Computed
const formMode = computed(() => (props.leverage ? 'edit' : 'create'));
const modalTitle = computed(() => (formMode.value === 'create' ? 'Create Leverage' : 'Edit Leverage'));

// Watch for modal show/hide
watch(() => props.show, (newVal) => {
  if (newVal) {
    resetForm();
    if (props.leverage) {
      formData.value = {
        name: props.leverage.name || '',
        value: props.leverage.value || '',
        is_active: props.leverage.is_active !== undefined ? props.leverage.is_active : true,
      };
    }
  }
});

// Reset form
const resetForm = () => {
  formData.value = {
    name: '',
    value: '',
    is_active: true,
  };
  errorMessage.value = '';
  successMessage.value = '';
};

// Close modal
const closeModal = () => {
  emit('update:show', false);
  emit('close');
  resetForm();
};

// Submit form
const submitForm = async () => {
  // Validation
  if (!formData.value.name.trim()) {
    errorMessage.value = 'Name is required.';
    return;
  }

  if (!formData.value.value.trim()) {
    errorMessage.value = 'Value is required.';
    return;
  }

  // Validate value is numeric
  const valueNum = parseInt(formData.value.value);
  if (isNaN(valueNum) || valueNum <= 0) {
    errorMessage.value = 'Value must be a positive number.';
    return;
  }

  submitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const payload = {
      name: formData.value.name.trim(),
      value: formData.value.value.trim(),
      is_active: formData.value.is_active ? 1 : 0,
    };

    let response;
    if (formMode.value === 'create') {
      response = await apiPost('/admin/leverages', payload);
    } else {
      response = await apiPut(`/admin/leverages/${props.leverage.id}`, payload);
    }

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      successMessage.value = data.message || (formMode.value === 'create' ? 'Leverage created successfully.' : 'Leverage updated successfully.');
      setTimeout(() => {
        emit('leverage-updated');
        closeModal();
      }, 1000);
    } else {
      errorMessage.value = data?.message || `Failed to ${formMode.value === 'create' ? 'create' : 'update'} leverage.`;
    }
  } catch (err) {
    console.error(`Error ${formMode.value === 'create' ? 'creating' : 'updating'} leverage:`, err);
    errorMessage.value = `Failed to ${formMode.value === 'create' ? 'create' : 'update'} leverage.`;
  } finally {
    submitting.value = false;
  }
};
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
      style="width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;"
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
              placeholder="Enter leverage name (e.g., 1:100)"
              :isRequired="true"
            />
          </div>

          <!-- Value -->
          <div class="mb-3">
            <label class="form-label text-sm fw-bold mb-1">
              Value <span class="text-danger">*</span>
            </label>
            <ArgonInput
              v-model="formData.value"
              type="text"
              placeholder="Enter leverage value (e.g., 100)"
              :isRequired="true"
            />
            <small class="text-muted">Enter the numeric value only (e.g., 100 for 1:100)</small>
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
/* Modal styles */
.card {
  background-color: white;
  border-radius: 0.5rem;
}
</style>

