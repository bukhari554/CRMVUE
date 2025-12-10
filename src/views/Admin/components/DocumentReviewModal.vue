<script setup>
import { ref, watch } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import { apiPatch } from '@/utils/api.js';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  document: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:show', 'document-updated']);

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const adminNotes = ref('');
const selectedStatus = ref('pending');
const imageError = ref({ front: false, back: false });
const localDocument = ref(null);

// Watch for document changes
watch(
  () => props.document,
  (newDoc) => {
    if (newDoc) {
      localDocument.value = { ...newDoc };
      selectedStatus.value = newDoc.status || 'pending';
      adminNotes.value = newDoc.admin_notes || '';
      imageError.value = { front: false, back: false };
      successMessage.value = '';
      errorMessage.value = '';
    }
  },
  { immediate: true }
);

// Watch for modal show
watch(
  () => props.show,
  (newVal) => {
    if (!newVal) {
      adminNotes.value = '';
      selectedStatus.value = 'pending';
      errorMessage.value = '';
      successMessage.value = '';
      imageError.value = { front: false, back: false };
      localDocument.value = null;
    } else if (props.document) {
      localDocument.value = { ...props.document };
      selectedStatus.value = props.document.status || 'pending';
      adminNotes.value = props.document.admin_notes || '';
    }
  }
);

// Handle status update
const handleStatusUpdate = async () => {
  const doc = localDocument.value || props.document;
  if (!doc || !doc.id) {
    errorMessage.value = 'Invalid document. Please refresh and try again.';
    return;
  }

  if (selectedStatus.value === 'pending') {
    errorMessage.value = 'Please select either Approved or Rejected status.';
    return;
  }

  submitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const payload = {
      status: selectedStatus.value,
    };

    // Add admin notes if provided
    if (adminNotes.value.trim()) {
      payload.admin_notes = adminNotes.value.trim();
    }

    const doc = localDocument.value || props.document;
    const response = await apiPatch(`/admin/documents/${doc.id}/status`, payload);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg =
        data?.message ||
        (data?.errors && Object.values(data.errors).flat().join(', ')) ||
        'Failed to update document status.';
      throw new Error(msg);
    }

    // Check if response has success flag
    if (data?.success && data?.data?.document) {
      // Update local document with response data
      localDocument.value = { ...data.data.document };
      selectedStatus.value = data.data.document.status;
      adminNotes.value = data.data.document.admin_notes || '';
      
      // Show success message
      successMessage.value = data.message || 'Document status updated successfully!';
      
      // Emit update to refresh list
      emit('document-updated');
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        closeModal();
      }, 1500);
    } else {
      // Fallback if response structure is different
      successMessage.value = 'Document status updated successfully!';
      emit('document-updated');
      setTimeout(() => {
        closeModal();
      }, 1500);
    }
  } catch (err) {
    console.error('Error updating document status:', err);
    errorMessage.value = err.message || 'Unable to update document status.';
  } finally {
    submitting.value = false;
  }
};

// Format document type
const formatDocumentType = (type) => {
  if (!type) return '—';
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (e) {
    return '—';
  }
};

// Handle image error
const handleImageError = (type, event) => {
  imageError.value[type] = true;
  // Suppress browser console errors for image loading failures
  if (event && event.preventDefault) {
    event.preventDefault();
  }
  // Only log to console, don't show as error message
  console.warn(`Image loading failed for ${type} image of document ${(localDocument.value || props.document)?.id}`);
};

// Close modal
const closeModal = () => {
  emit('update:show', false);
};
</script>

<template>
  <div
    v-if="props.show && (props.document || localDocument)"
    class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
    style="background-color: rgba(0, 0, 0, 0.5); z-index: 1050;"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-3 shadow-lg" style="width: 90%; max-width: 1000px; max-height: 90vh; overflow-y: auto;">
      <!-- Header -->
      <div class="p-4 border-bottom">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0 fw-bold d-flex align-items-center gap-2">
            <i class="fas fa-id-card"></i>
            Review Document #{{ (localDocument || props.document)?.id }}
          </h5>
          <button
            type="button"
            class="btn btn-sm btn-link text-dark p-0"
            @click="closeModal"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4">
        <!-- Loading State -->
        <div v-if="loading" class="text-center text-muted py-5">
          <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
          <p>Loading document details...</p>
        </div>

        <!-- Success Message -->
        <div v-else-if="successMessage" class="alert alert-success mb-3">
          <i class="fas fa-check-circle me-2"></i>
          {{ successMessage }}
        </div>

        <!-- Error Message -->
        <div v-else-if="errorMessage" class="alert alert-danger mb-3">
          <i class="fas fa-exclamation-circle me-2"></i>
          {{ errorMessage }}
        </div>

        <!-- Document Content -->
        <div v-if="!loading && (localDocument || props.document)">

        <!-- User Information -->
        <div class="card border mb-4">
          <div class="card-body">
            <h6 class="fw-bold mb-3">
              <i class="fas fa-user me-2"></i>
              User Information
            </h6>
            <div class="row">
              <div class="col-md-6 mb-2">
                <span class="text-sm text-muted">Name:</span>
                <span class="text-sm fw-bold ms-2">{{ (localDocument || props.document)?.user?.name || '—' }}</span>
              </div>
              <div class="col-md-6 mb-2">
                <span class="text-sm text-muted">Email:</span>
                <span class="text-sm fw-bold ms-2">{{ (localDocument || props.document)?.user?.email || '—' }}</span>
              </div>
              <div class="col-md-6 mb-2">
                <span class="text-sm text-muted">User ID:</span>
                <span class="text-sm fw-bold ms-2">{{ (localDocument || props.document)?.user_id || '—' }}</span>
              </div>
              <div class="col-md-6 mb-2">
                <span class="text-sm text-muted">Account Type:</span>
                <span class="text-sm fw-bold ms-2">{{ (localDocument || props.document)?.user?.account_type || '—' }}</span>
              </div>
              <div class="col-md-6 mb-2">
                <span class="text-sm text-muted">Country:</span>
                <span class="text-sm fw-bold ms-2">{{ (localDocument || props.document)?.user?.country || '—' }}</span>
              </div>
              <div class="col-md-6 mb-2">
                <span class="text-sm text-muted">Document Type:</span>
                <span class="text-sm fw-bold ms-2">{{ formatDocumentType((localDocument || props.document)?.document_type) }}</span>
              </div>
              <div class="col-md-6 mb-2">
                <span class="text-sm text-muted">Current Status:</span>
                <span
                  class="badge ms-2"
                  :style="{
                    backgroundColor: (localDocument || props.document)?.status === 'approved' ? '#d4edda' : (localDocument || props.document)?.status === 'rejected' ? '#f8d7da' : '#fff3cd',
                    color: (localDocument || props.document)?.status === 'approved' ? '#28a745' : (localDocument || props.document)?.status === 'rejected' ? '#dc3545' : '#ffc107',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                  }"
                >
                  {{ ((localDocument || props.document)?.status || 'PENDING').toUpperCase() }}
                </span>
              </div>
              <div class="col-md-6 mb-2">
                <span class="text-sm text-muted">Submitted:</span>
                <span class="text-sm fw-bold ms-2">{{ formatDate((localDocument || props.document)?.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Document Images -->
        <div class="row mb-4">
          <!-- Front Image -->
          <div class="col-md-6 mb-3">
            <h6 class="fw-bold mb-2">
              <i class="fas fa-image me-2"></i>
              Front Image
            </h6>
            <div class="card border" style="min-height: 300px;">
              <div class="card-body d-flex align-items-center justify-content-center p-3">
                <div v-if="imageError.front" class="text-center text-muted">
                  <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                  <p class="mb-0">Image could not be loaded</p>
                  <small class="text-muted">The image URL may be invalid or inaccessible</small>
                </div>
                <img
                  v-else-if="(localDocument || props.document)?.front_image_url"
                  :src="(localDocument || props.document)?.front_image_url"
                  alt="Front Document"
                  class="img-fluid rounded"
                  style="max-height: 400px; cursor: pointer;"
                  @error="(e) => handleImageError('front', e)"
                  @click="window.open((localDocument || props.document)?.front_image_url, '_blank')"
                />
                <div v-else class="text-center text-muted">
                  <i class="fas fa-image fa-2x mb-2 opacity-50"></i>
                  <p class="mb-0">No front image available</p>
                </div>
              </div>
            </div>
            <div class="text-center mt-2">
              <ArgonButton
                v-if="(localDocument || props.document)?.front_image_url && !imageError.front"
                color="info"
                variant="outline"
                size="sm"
                @click="window.open((localDocument || props.document)?.front_image_url, '_blank')"
              >
                <i class="fas fa-external-link-alt me-1"></i>
                Open in New Tab
              </ArgonButton>
            </div>
          </div>

          <!-- Back Image -->
          <div class="col-md-6 mb-3">
            <h6 class="fw-bold mb-2">
              <i class="fas fa-image me-2"></i>
              Back Image
            </h6>
            <div class="card border" style="min-height: 300px;">
              <div class="card-body d-flex align-items-center justify-content-center p-3">
                <div v-if="imageError.back" class="text-center text-muted">
                  <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                  <p class="mb-0">Image could not be loaded</p>
                  <small class="text-muted">The image URL may be invalid or inaccessible</small>
                </div>
                <img
                  v-else-if="(localDocument || props.document)?.back_image_url"
                  :src="(localDocument || props.document)?.back_image_url"
                  alt="Back Document"
                  class="img-fluid rounded"
                  style="max-height: 400px; cursor: pointer;"
                  @error="(e) => handleImageError('back', e)"
                  @click="window.open((localDocument || props.document)?.back_image_url, '_blank')"
                />
                <div v-else class="text-center text-muted">
                  <i class="fas fa-image fa-2x mb-2 opacity-50"></i>
                  <p class="mb-0">No back image available</p>
                </div>
              </div>
            </div>
            <div class="text-center mt-2">
              <ArgonButton
                v-if="(localDocument || props.document)?.back_image_url && !imageError.back"
                color="info"
                variant="outline"
                size="sm"
                @click="window.open((localDocument || props.document)?.back_image_url, '_blank')"
              >
                <i class="fas fa-external-link-alt me-1"></i>
                Open in New Tab
              </ArgonButton>
            </div>
          </div>
        </div>

        <!-- Admin Notes (if exists) -->
        <div v-if="(localDocument || props.document)?.admin_notes" class="card border mb-4" style="background-color: #fff3cd;">
          <div class="card-body">
            <h6 class="fw-bold mb-2">
              <i class="fas fa-sticky-note me-2"></i>
              Previous Admin Notes
            </h6>
            <p class="mb-0 text-sm">{{ (localDocument || props.document)?.admin_notes }}</p>
          </div>
        </div>

        <!-- Status Update Form -->
        <div class="card border">
          <div class="card-body">
            <h6 class="fw-bold mb-3">
              <i class="fas fa-edit me-2"></i>
              Update Status
            </h6>
            
            <div class="mb-3">
              <label class="form-label fw-bold">Status <span class="text-danger">*</span></label>
              <select
                v-model="selectedStatus"
                class="form-select"
                :disabled="submitting"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Admin Notes (Optional)</label>
              <textarea
                v-model="adminNotes"
                class="form-control"
                rows="4"
                placeholder="Enter notes about this document review..."
                :disabled="submitting"
              ></textarea>
              <small class="text-muted">These notes will be visible to the user.</small>
            </div>
          </div>
        </div>
        </div>

        <!-- No Document Available -->
        <div v-else-if="!loading && !localDocument && !props.document" class="text-center text-muted py-5">
          <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
          <p>Document information not available.</p>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="!loading && (localDocument || props.document)" class="p-4 border-top d-flex justify-content-end gap-2">
        <ArgonButton
          color="dark"
          variant="gradient"
          @click="closeModal"
          :disabled="submitting"
        >
          Cancel
        </ArgonButton>
        <ArgonButton
          color="success"
          variant="gradient"
          :disabled="submitting || selectedStatus === 'pending'"
          @click="handleStatusUpdate"
        >
          <i class="fas fa-check me-1"></i>
          {{ submitting ? 'Updating...' : 'Update Status' }}
        </ArgonButton>
      </div>
      <div v-else class="p-4 border-top d-flex justify-content-end">
        <ArgonButton
          color="dark"
          variant="gradient"
          @click="closeModal"
        >
          Close
        </ArgonButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-sm {
  font-size: 0.875rem;
}

.card {
  border-radius: 0.5rem;
}

img {
  transition: transform 0.2s;
}

img:hover {
  transform: scale(1.02);
}
</style>

