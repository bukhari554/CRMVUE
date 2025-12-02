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
  <div
    v-if="show"
    class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
    style="background-color: rgba(0, 0, 0, 0.5); z-index: 1050;"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-3 shadow-lg" style="width: 90%; max-width: 500px;">
      <div class="p-4 border-bottom">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0 fw-bold">Create New Ticket</h5>
          <button
            type="button"
            class="btn btn-sm btn-link text-dark p-0"
            @click="closeModal"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="p-4">
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
</template>

