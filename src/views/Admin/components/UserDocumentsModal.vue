<script setup>
import { ref, computed } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import { apiPatch } from '@/utils/api.js';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  user: {
    type: Object,
    default: null,
  },
  documents: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:show', 'document-updated']);

const activeCategory = ref('proof_of_id'); // 'proof_of_id' or 'proof_of_residence'
const submitting = ref({});
const errorMessage = ref('');
const successMessage = ref('');

// Document type labels
const documentTypeLabels = {
  driver_license: "Driver's License",
  passport: "Passport",
  national_id: "National ID",
  bank_statement: "Bank Statement",
  rent_agreement: "Rent Agreement",
  utility_bill: "Utility Bill",
  wire_transfer_proof: "Wire Transfer Proof",
};

// Filter documents by category
const proofIdDocuments = computed(() => {
  if (!props.documents) return [];
  return props.documents.filter(doc => {
    const category = doc.category || '';
    return category === 'proof_of_id' || 
           ['driver_license', 'passport', 'national_id'].includes(doc.document_type);
  });
});

const proofResidenceDocuments = computed(() => {
  if (!props.documents) return [];
  return props.documents.filter(doc => {
    const category = doc.category || '';
    return category === 'proof_of_residence' || 
           ['bank_statement', 'rent_agreement', 'utility_bill', 'wire_transfer_proof'].includes(doc.document_type);
  });
});

const currentDocuments = computed(() => {
  if (activeCategory.value === 'proof_of_id') {
    return proofIdDocuments.value;
  } else if (activeCategory.value === 'proof_of_residence') {
    return proofResidenceDocuments.value;
  }
  return [];
});

// Get status badge class
const getStatusBadgeClass = (status) => {
  const s = (status || "pending").toLowerCase();
  if (s === "approved") return "badge bg-success";
  if (s === "rejected") return "badge bg-danger";
  if (s === "pending") return "badge bg-warning";
  return "badge bg-secondary";
};

// Get status text
const getStatusText = (status) => {
  const s = (status || "pending").toLowerCase();
  if (s === "not_submitted") return "Not Submitted";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Handle status update (accept/reject)
const handleStatusUpdate = async (document, status) => {
  if (!document || !document.id) {
    errorMessage.value = 'Invalid document. Please refresh and try again.';
    return;
  }

  if (status !== 'approved' && status !== 'rejected') {
    errorMessage.value = 'Invalid status. Please select Approved or Rejected.';
    return;
  }

  submitting.value[document.id] = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const payload = {
      status: status,
    };

    const response = await apiPatch(`/admin/documents/${document.id}/status`, payload);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg =
        data?.message ||
        (data?.errors && Object.values(data.errors).flat().join(', ')) ||
        'Failed to update document status.';
      throw new Error(msg);
    }

    successMessage.value = data?.message || `Document ${status} successfully!`;
    
    // Emit update to refresh list
    emit('document-updated');
    
    // Clear success message after 2 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 2000);
  } catch (err) {
    console.error('Error updating document status:', err);
    errorMessage.value = err.message || 'Unable to update document status.';
    setTimeout(() => {
      errorMessage.value = '';
    }, 3000);
  } finally {
    submitting.value[document.id] = false;
  }
};

// Select category
const selectCategory = (category) => {
  activeCategory.value = category;
  errorMessage.value = '';
  successMessage.value = '';
};

// Close modal
const closeModal = () => {
  emit('update:show', false);
  activeCategory.value = 'proof_of_id';
  errorMessage.value = '';
  successMessage.value = '';
};

// View document images
const showImageModal = ref(false);
const viewingDocument = ref(null);

const viewDocument = (doc) => {
  viewingDocument.value = doc;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  viewingDocument.value = null;
};
</script>

<template>
  <!-- Main Modal -->
  <div
    v-if="props.show && props.user"
    class="doc-modal-backdrop"
    @click.self="closeModal"
  >
    <div class="doc-modal">
      <div class="doc-modal-header">
        <h5 class="mb-0">User Documents - {{ props.user?.name || 'User' }}</h5>
        <button
          type="button"
          class="btn btn-sm btn-light"
          @click="closeModal"
        >
          ✕
        </button>
      </div>

      <div class="doc-modal-content">
        <!-- Left Sidebar -->
        <div class="doc-modal-sidebar">
          <!-- Proof of ID Card -->
          <div
            class="doc-category-card"
            :class="{ active: activeCategory === 'proof_of_id' }"
            @click="selectCategory('proof_of_id')"
          >
            <div class="text-center mb-2">
              <span v-if="proofIdDocuments.length === 0" class="text-danger" style="font-size: 20px;">❗</span>
            </div>
            <div class="text-center fw-bold">Proof of ID</div>
          </div>

          <!-- Proof of Residence Card -->
          <div
            class="doc-category-card"
            :class="{ active: activeCategory === 'proof_of_residence' }"
            @click="selectCategory('proof_of_residence')"
          >
            <div class="text-center mb-2">
              <span v-if="proofResidenceDocuments.length === 0" class="text-danger" style="font-size: 20px;">❗</span>
            </div>
            <div class="text-center fw-bold">Proof of Residence</div>
          </div>
        </div>

        <!-- Right Content Area -->
        <div class="doc-modal-main">
          <div class="p-4">
            <!-- Header with Info Icon -->
            <div class="d-flex align-items-center mb-3">
              <h6 class="mb-0 me-2">
                {{ activeCategory === 'proof_of_id' ? 'Proof of ID' : 'Proof of Residence' }}
              </h6>
              <i class="fas fa-info-circle text-muted" style="font-size: 14px;"></i>
            </div>

            <!-- User Info -->
            <div class="mb-3 p-3 rounded" style="background-color: #e9ecef; color: #000000; border: 1px solid #dee2e6;">
              <div class="row">
                <div class="col-md-6 mb-2">
                  <strong>Name:</strong> {{ props.user?.name || '—' }}
                </div>
                <div class="col-md-6 mb-2">
                  <strong>Email:</strong> {{ props.user?.email || '—' }}
                </div>
                <div class="col-md-6 mb-2">
                  <strong>User ID:</strong> {{ props.user?.id || '—' }}
                </div>
                <div class="col-md-6 mb-2">
                  <strong>Country:</strong> {{ props.user?.country || '—' }}
                </div>
              </div>
            </div>

            <!-- Messages -->
            <div v-if="errorMessage" class="alert alert-danger mb-3">
              {{ errorMessage }}
            </div>
            <div v-if="successMessage" class="alert alert-success mb-3">
              {{ successMessage }}
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="text-center text-muted py-5">
              <i class="fas fa-spinner fa-spin me-2"></i>
              Loading documents...
            </div>

            <!-- Documents Table -->
            <div v-else-if="currentDocuments.length > 0" class="mb-3" style="overflow-x: auto;">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="doc in currentDocuments" :key="doc.id">
                    <td>{{ documentTypeLabels[doc.document_type] || doc.document_type }}</td>
                    <td>
                      <span :class="getStatusBadgeClass(doc.status)">
                        {{ getStatusText(doc.status) }}
                      </span>
                    </td>
                    <td>
                      <small>{{ new Date(doc.created_at).toLocaleDateString() }}</small>
                    </td>
                    <td>
                      <div class="d-flex gap-2">
                        <ArgonButton
                          color="info"
                          size="sm"
                          @click="viewDocument(doc)"
                          :disabled="!doc.front_image_url"
                        >
                          View
                        </ArgonButton>
                        <ArgonButton
                          v-if="doc.status !== 'approved'"
                          color="success"
                          size="sm"
                          :disabled="submitting[doc.id]"
                          @click="handleStatusUpdate(doc, 'approved')"
                        >
                          {{ submitting[doc.id] ? '...' : 'Approve' }}
                        </ArgonButton>
                        <ArgonButton
                          v-if="doc.status !== 'rejected'"
                          color="danger"
                          size="sm"
                          :disabled="submitting[doc.id]"
                          @click="handleStatusUpdate(doc, 'rejected')"
                        >
                          {{ submitting[doc.id] ? '...' : 'Reject' }}
                        </ArgonButton>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else-if="!loading" class="text-center text-muted py-5">
              <i class="fas fa-folder-open fa-2x mb-3 opacity-50"></i>
              <p class="mb-0">No {{ activeCategory === 'proof_of_id' ? 'Proof of ID' : 'Proof of Residence' }} documents found.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Viewer Modal -->
    <div
      v-if="showImageModal && viewingDocument"
      class="doc-modal-backdrop"
      @click.self="closeImageModal"
    >
      <div class="image-modal">
        <div class="image-modal-header">
          <h5 class="mb-0">View Document</h5>
          <button
            type="button"
            class="btn btn-sm btn-light"
            @click="closeImageModal"
          >
            ✕
          </button>
        </div>
        <div class="image-modal-body">
          <div v-if="viewingDocument.back_image_url" class="d-flex gap-3 flex-wrap justify-content-center">
            <!-- Front Image -->
            <div class="image-container">
              <h6 class="text-center mb-2">Front</h6>
              <img
                v-if="viewingDocument.front_image_url"
                :src="viewingDocument.front_image_url"
                alt="Front Document"
                class="document-image"
              />
            </div>
            <!-- Back Image -->
            <div class="image-container">
              <h6 class="text-center mb-2">Back</h6>
              <img
                v-if="viewingDocument.back_image_url"
                :src="viewingDocument.back_image_url"
                alt="Back Document"
                class="document-image"
              />
            </div>
          </div>
          <div v-else class="single-image-container">
            <img
              v-if="viewingDocument.front_image_url"
              :src="viewingDocument.front_image_url"
              alt="Document"
              class="document-image"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.doc-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 0;
}

@media (max-width: 768px) {
  .doc-modal-backdrop {
    align-items: flex-start;
    padding: 0;
  }
}

.doc-modal {
  background: #ffffff;
  border-radius: 10px;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  margin: 10px;
}

@media (max-width: 768px) {
  .doc-modal {
    max-width: 100%;
    max-height: 95vh;
    margin: 5px;
    border-radius: 8px;
  }
}

.doc-modal-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.doc-modal-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

@media (max-width: 768px) {
  .doc-modal-content {
    flex-direction: column;
  }
}

.doc-modal-sidebar {
  width: 250px;
  background: #f8f9fa;
  border-right: 1px solid #e5e5e5;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .doc-modal-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e5e5;
    padding: 12px;
    max-height: 200px;
    overflow-y: auto;
    flex-direction: row;
    gap: 8px;
  }
}

.doc-category-card {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

@media (max-width: 768px) {
  .doc-category-card {
    padding: 12px;
    flex: 1;
    min-width: 0;
  }
}

.doc-category-card:hover {
  background: #f0f0f0;
  border-color: #007bff;
}

.doc-category-card.active {
  background: #e7f3ff;
  border-color: #007bff;
}

.doc-modal-main {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
}

@media (max-width: 768px) {
  .doc-modal-main {
    padding: 12px;
  }
  
  .doc-modal-main .p-4 {
    padding: 12px !important;
  }
}

.image-modal {
  background: #ffffff;
  border-radius: 10px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  margin: 10px;
}

@media (max-width: 768px) {
  .image-modal {
    max-width: 100%;
    max-height: 95vh;
    margin: 5px;
    border-radius: 8px;
  }
}

.image-modal-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.image-modal-body {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  overflow: auto;
  background: #f8f9fa;
}

@media (max-width: 768px) {
  .image-modal-body {
    padding: 12px;
    flex-direction: column;
  }
  
  .image-modal-body .d-flex.gap-3 {
    flex-direction: column !important;
    width: 100%;
  }
}

.image-container {
  flex: 1;
  min-width: 300px;
  max-width: 45%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media (max-width: 768px) {
  .image-container {
    min-width: 100%;
    max-width: 100%;
    margin-bottom: 20px;
  }
}

.single-image-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.document-image {
  max-width: 100%;
  max-height: 60vh;
  min-height: 300px;
  width: auto;
  height: auto;
  object-fit: contain;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .document-image {
    max-height: 50vh;
    min-height: 200px;
  }
}
</style>
