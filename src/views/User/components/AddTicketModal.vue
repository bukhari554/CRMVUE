<script setup>
import { ref, watch } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import { apiGet, apiPost } from '@/utils/api.js';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:show', 'ticket-created']);

const ticketForm = ref({
  subject: '',
  message: '',
  category_id: null,
});

const submitting = ref(false);
const errorMessage = ref('');
const categories = ref([]);
const loadingCategories = ref(false);

// Fetch categories from API
const loadCategories = async () => {
  if (categories.value.length > 0) return; // Already loaded
  
  loadingCategories.value = true;
  try {
    const response = await apiGet('/client/tickets/categories');
    const data = await response.json().catch(() => null);

    if (response.ok && data) {
      // Handle different response structures
      if (data.success && data.data) {
        categories.value = Array.isArray(data.data) ? data.data : (data.data.categories || []);
      } else if (Array.isArray(data)) {
        categories.value = data;
      } else if (data.categories) {
        categories.value = data.categories;
      } else if (data.data) {
        categories.value = Array.isArray(data.data) ? data.data : [];
      }
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  } finally {
    loadingCategories.value = false;
  }
};

// Load categories when modal is shown
watch(() => props.show, (newVal) => {
  if (newVal) {
    loadCategories();
  }
});

const handleSubmit = async () => {
  errorMessage.value = '';

  if (!ticketForm.value.subject || !ticketForm.value.message || !ticketForm.value.category_id) {
    errorMessage.value = 'Please fill in all fields.';
    return;
  }

  submitting.value = true;

  try {
    const response = await apiPost('/client/tickets', {
      category_id: ticketForm.value.category_id,
      subject: ticketForm.value.subject,
      message: ticketForm.value.message,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      let msg = 'Validation error';
      
      // Try to extract detailed error messages
      if (data?.message) {
        msg = data.message;
      } else if (data?.errors) {
        // Handle Laravel-style validation errors
        const errorMessages = Object.values(data.errors).flat();
        if (errorMessages.length > 0) {
          msg = errorMessages.join(', ');
        }
      } else if (data?.error) {
        msg = data.error;
      }
      
      throw new Error(msg);
    }

    ticketForm.value = {
      subject: '',
      message: '',
      category_id: null,
    };
    emit('ticket-created');
    emit('update:show', false);
  } catch (err) {
    console.error('POST /client/tickets error:', err);
    errorMessage.value = err.message || 'Unable to create ticket.';
  } finally {
    submitting.value = false;
  }
};

const closeModal = () => {
  emit('update:show', false);
  ticketForm.value = {
    subject: '',
    message: '',
    category_id: null,
  };
  errorMessage.value = '';
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
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
            <h5 class="mb-0 fw-bold">Create New Ticket</h5>
          </div>
          <div class="modal-body-content">
        <div
          v-if="errorMessage"
          class="mb-3 rounded p-3 text-center text-white fw-bold"
          style="background: linear-gradient(310deg, #f5365c, #f56036);"
        >
          {{ errorMessage }}
        </div>

        <div class="mb-3">
          <label class="form-label fw-bold">Category</label>
          <select
            v-model="ticketForm.category_id"
            class="form-select"
            :disabled="loadingCategories"
            @change="errorMessage = ''"
          >
            <option :value="null">{{ loadingCategories ? 'Loading categories...' : 'Select Category' }}</option>
            <option
              v-for="cat in categories"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.name || cat.label || cat.value || cat.category_name }}
            </option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label fw-bold">Subject</label>
          <input
            v-model="ticketForm.subject"
            type="text"
            class="form-control"
            placeholder="Enter ticket subject"
            @input="errorMessage = ''"
          />
        </div>

        <div class="mb-4">
          <label class="form-label fw-bold">Message</label>
          <textarea
            v-model="ticketForm.message"
            class="form-control"
            rows="4"
            placeholder="Describe your issue..."
            @input="errorMessage = ''"
          ></textarea>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <ArgonButton
            color="secondary"
            variant="outline"
            @click="closeModal"
          >
            Cancel
          </ArgonButton>
          <ArgonButton
            color="success"
            variant="gradient"
            :disabled="submitting"
            @click="handleSubmit"
          >
            {{ submitting ? 'Submitting...' : 'Submit Ticket' }}
          </ArgonButton>
        </div>
          </div>
        </div>
      </div>
      </Transition>
    </Teleport>
</template>

<style scoped>
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

