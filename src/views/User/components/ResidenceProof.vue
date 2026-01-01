<script setup>
import { ref, computed } from 'vue';
import { apiGet, apiPost } from '@/utils/api.js';
import { showToast } from '@/utils/toast.js';
import ArgonButton from '@/components/ArgonButton.vue';

const loading = ref(false);
const submitting = ref(false);
const documents = ref([]);
const message = ref('');
const messageType = ref('');

// Model-aligned constants
const CATEGORY_PROOF_OF_RESIDENCE = 'proof_of_residence';

// Document type selection with default value
const selectedType = ref('bank_statement');  // Default: Bank Statement
const documentImage = ref(null);
const documentPreview = ref(null);

// Document types for Proof of Residence
const proofResidenceTypes = [
  { value: "bank_statement", label: "Bank Statement", icon: "fa-file-invoice-dollar" },
  { value: "rent_agreement", label: "Rent Agreement", icon: "fa-file-contract" },
  { value: "utility_bill", label: "Utility Bill", icon: "fa-file-invoice" },
  { value: "wire_transfer_proof", label: "Wire Transfer Proof", icon: "fa-money-check-alt" },
];

// Get current selected document type info
const currentDocType = computed(() => {
  if (!selectedType.value) return null;
  return proofResidenceTypes.find(d => d.value === selectedType.value);
});

// Check if ANY document in the category has pending status
const hasAnyPending = computed(() => {
  return documents.value.some(d => (d?.status || '').toLowerCase() === 'pending');
});

// Get the pending document if available
const pendingDocument = computed(() => {
  return documents.value.find(d => (d?.status || '').toLowerCase() === 'pending');
});

// KYC rule: allow upload only when the current Proof-of-Residence is NOT uploaded OR REJECTED.
// If it's PENDING or APPROVED, uploads are blocked.
// Check status for the currently selected document type
const kycLockStatus = computed(() => {
  // If ANY document is pending, lock everything
  if (hasAnyPending.value) {
    return 'pending';
  }
  
  const currentDoc = documents.value.find(d => d.document_type === selectedType.value);
  if (!currentDoc) return null;
  
  const status = (currentDoc?.status || '').toLowerCase();
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return null;
});

// Check if file is selected (this will trigger the restriction)
const isFileSelected = computed(() => {
  return documentImage.value !== null;
});

// Check if document type is disabled
const isDocTypeDisabled = (docType) => {
  // Disable if file is selected and this is not the selected document type
  if (isFileSelected.value && docType !== selectedType.value) {
    return true;
  }
  
  // If ANY document is pending, disable ALL tabs
  if (hasAnyPending.value) {
    return true;
  }
  
  // If the specific document type is approved, disable it
  const docStatus = documents.value.find(d => d.document_type === docType)?.status?.toLowerCase();
  if (docStatus === 'approved') {
    return true;
  }
  
  return false;
};

// API: Load documents
const loadDocuments = async () => {
  loading.value = true;
  try {
    // Prefer model-aligned endpoint; fallback to legacy endpoint if not available
    let response = await apiGet(`/client/documents?category=${encodeURIComponent(CATEGORY_PROOF_OF_RESIDENCE)}`);
    if (!response.ok && (response.status === 404 || response.status === 405)) {
      response = await apiGet('/client/documents/proof-of-residence');
    }

    const data = await response.json().catch(() => null);

    let docs = [];
    if (data?.success && data?.data?.documents) {
      docs = Array.isArray(data.data.documents)
        ? data.data.documents
        : data.data.documents.data || [];
    } else if (data?.data?.documents) {
      docs = data.data.documents;
    } else if (data?.documents) {
      docs = data.documents;
    } else if (data?.data) {
      docs = Array.isArray(data.data) ? data.data : [];
    }

    documents.value = Array.isArray(docs) ? docs : [];
    
    // If there's an uploaded document, set it as selected type
    if (documents.value.length > 0) {
      selectedType.value = documents.value[0].document_type;
    }
  } catch (error) {
    console.error('GET /client/documents/proof-of-residence error:', error);
    documents.value = [];
  } finally {
    loading.value = false;
  }
};

const getDocumentStatus = (docType) => {
  const doc = documents.value.find(d => d.document_type === docType);
  return doc?.status || null;
};

const getStatusBadge = (status) => {
  if (!status) return { text: 'Not Uploaded', class: 'bg-secondary', icon: 'fa-circle' };
  
  const statusMap = {
    pending: { text: 'Pending Review', class: 'bg-warning', icon: 'fa-clock' },
    approved: { text: 'Approved', class: 'bg-success', icon: 'fa-check-circle' },
    rejected: { text: 'Rejected', class: 'bg-danger', icon: 'fa-times-circle' },
  };
  
  return statusMap[status.toLowerCase()] || { text: status, class: 'bg-secondary', icon: 'fa-circle' };
};

const handleFileSelect = (event) => {
  if (hasAnyPending.value || kycLockStatus.value === 'approved' || submitting.value) {
    event.preventDefault();
    return;
  }

  const file = event.target.files[0];
  if (!file) return;

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    showMessage('File size must be less than 5MB', 'error');
    event.target.value = '';
    return;
  }

  // Allow images and PDF
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    showMessage('Only JPG, PNG, WEBP, and PDF files are allowed', 'error');
    event.target.value = '';
    return;
  }

  documentImage.value = file;
  
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      documentPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    documentPreview.value = 'pdf';
  }
};

const removeFile = () => {
  if (hasAnyPending.value || kycLockStatus.value === 'approved' || submitting.value) {
    return;
  }
  documentImage.value = null;
  documentPreview.value = null;
  const input = document.getElementById('document-image-input');
  if (input) input.value = '';
};

const clearForm = () => {
  selectedType.value = 'bank_statement';  // Reset to default
  documentImage.value = null;
  documentPreview.value = null;
  const input = document.getElementById('document-image-input');
  if (input) input.value = '';
};

// API: Submit document
const submitDocument = async () => {
  message.value = '';
  messageType.value = '';

  if (hasAnyPending.value) {
    showMessage('Upload is disabled while a document is pending review.', 'error');
    return;
  }

  if (kycLockStatus.value === 'approved') {
    showMessage('Upload is disabled while your document is already approved.', 'error');
    return;
  }

  if (!selectedType.value) {
    showMessage('Please select a document type', 'error');
    return;
  }

  if (!documentImage.value) {
    showMessage('Please select a document to upload', 'error');
    return;
  }

  // Model-aligned: category, document_type, front_image (back_image optional)
  const formData = new FormData();
  formData.append('category', CATEGORY_PROOF_OF_RESIDENCE);
  formData.append('document_type', selectedType.value);
  formData.append('front_image', documentImage.value);

  submitting.value = true;

  try {
    // Prefer model-aligned endpoint; fallback to legacy endpoint if not available
    // Use silent: true for first attempt to suppress error toast if it fails (we have a fallback)
    let response = await apiPost('/client/documents', formData, { silent: true });
    if (!response.ok && (response.status === 404 || response.status === 405)) {
      // Legacy endpoint may not accept category field; rebuild without it
      const legacyForm = new FormData();
      legacyForm.append('document_type', selectedType.value);
      legacyForm.append('front_image', documentImage.value);
      // Second attempt - show toast normally since this is the final attempt
      response = await apiPost('/client/documents/proof-of-residence', legacyForm);
    }

    if (!response) {
      throw new Error("Network error: No response from server");
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg =
        data?.message ||
        (data?.errors && Object.values(data.errors).flat().join(", ")) ||
        `Upload failed (${response.status} ${response.statusText})`;
      throw new Error(msg);
    }

    showMessage(data?.message || 'Document uploaded successfully', 'success');
    await loadDocuments();
    clearForm();
  } catch (error) {
    console.error('POST document error:', error);
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      showMessage("Network error: Unable to connect to server. Please check your connection and try again.", 'error');
    } else if (error.message) {
      showMessage(error.message, 'error');
    } else {
      showMessage("Unable to upload document. Please try again.", 'error');
    }
  } finally {
    submitting.value = false;
  }
};

const showMessage = (msg, type) => {
  message.value = msg;
  messageType.value = type;
  // Also show toast notification
  showToast(msg, type === 'error' ? 'error' : type === 'success' ? 'success' : 'info');
  setTimeout(() => {
    message.value = '';
    messageType.value = '';
  }, 5000);
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    return '—';
  }
};

// Method to set documents without API call (used by parent)
const setDocuments = (docs) => {
  documents.value = Array.isArray(docs) ? docs : [];
  loading.value = false;
  
  // If there's an uploaded document, set it as selected type
  if (documents.value.length > 0) {
    selectedType.value = documents.value[0].document_type;
  }
};

// Don't load on mount - parent will provide data
// onMounted(() => {
//   loadDocuments();
// });

defineExpose({
  loadDocuments,
  clearForm,
  setDocuments,
});
</script>

<template>

      <div class="proof-of-residence-wrapper">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-4">
            <div class="mb-4">
              <h4 class="mb-1 text-dark fw-bold">
                <i class="fas fa-home me-2"></i>
                Proof of Residence
              </h4>
              <p class="text-sm text-muted mb-0">Upload your address verification documents</p>
            </div>

            <div v-if="message" class="alert mb-4" :class="messageType === 'success' ? 'alert-success' : 'alert-danger'" role="alert">
              <i class="fas" :class="messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'"></i>
              {{ message }}
            </div>

            <div class="row g-4">
              <!-- Upload Section -->
              <div class="col-lg-8">
                <div class="upload-card">
                  <h5 class="mb-3 text-dark fw-bold">Upload Document</h5>

                  <!-- Document Type Selection -->
                  <div class="mb-4">
                    <label class="form-label fw-bold text-dark mb-2">
                      <i class="fas fa-file-alt me-1"></i>
                      Select Document Type
                    </label>
                    <div class="document-type-grid">
                      <div 
                        v-for="docType in proofResidenceTypes" 
                        :key="docType.value"
                        class="doc-type-card"
                        :class="{ 
                          'active': selectedType === docType.value,
                          'disabled': isDocTypeDisabled(docType.value)
                        }"
                        @click="!isDocTypeDisabled(docType.value) && (selectedType = docType.value)"
                      >
                        <i class="fas" :class="docType.icon"></i>
                        <span class="doc-type-label">{{ docType.label }}</span>
                        <div v-if="selectedType === docType.value" class="selected-indicator">
                          <i class="fas fa-check-circle"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="upload-section">
                    <label class="upload-label">
                      <i class="fas fa-cloud-upload-alt me-1"></i>
                      Upload Document
                    </label>
                    
                    <div v-if="documentPreview" class="preview-container-large">
                      <div v-if="documentPreview === 'pdf'" class="pdf-preview-large">
                        <i class="fas fa-file-pdf fa-4x text-danger"></i>
                        <p class="mb-0 mt-3 text-sm fw-bold">{{ documentImage?.name }}</p>
                        <p class="mb-0 text-xs text-muted mt-1">PDF Document</p>
                      </div>
                      <img v-else :src="documentPreview" alt="Document preview" class="preview-image-large">
                      <button @click="removeFile" class="remove-btn-large" type="button">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                    
                    <div v-else class="upload-box-large">
                      <input
                        type="file"
                        id="document-image-input"
                        @change="handleFileSelect($event)"
                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                        class="file-input"
                        :disabled="submitting || hasAnyPending || kycLockStatus === 'approved'"
                      >
                      <label 
                        for="document-image-input" 
                        class="upload-area-large"
                        :class="{ 'disabled': submitting || hasAnyPending || kycLockStatus === 'approved' }"
                      >
                        <i class="fas fa-cloud-upload-alt fa-4x mb-3 text-primary"></i>
                        <h5 class="mb-2 fw-bold text-dark">Click to upload</h5>
                        <p class="mb-0 text-sm text-muted">Upload your proof of residence document</p>
                        <p class="mb-0 text-xs text-muted mt-2">JPG, PNG, WEBP or PDF (max 5MB)</p>
                      </label>
                    </div>

                    <div class="mt-4">
                      <ArgonButton
                        color="dark"
                        variant="gradient"
                        size="lg"
                        class="w-100"
                        :disabled="!documentImage || submitting || hasAnyPending || kycLockStatus === 'approved'"
                        @click="submitDocument"
                      >
                        <i class="fas" :class="submitting ? 'fa-spinner fa-spin' : 'fa-upload'"></i>
                        {{
                          submitting
                            ? 'Uploading...'
                            : (hasAnyPending
                                ? (pendingDocument ? `${proofResidenceTypes.find(t => t.value === pendingDocument.document_type)?.label || 'Document'} Pending Review` : 'Pending Review')
                                : (kycLockStatus === 'approved'
                                    ? 'Document Approved'
                                    : (kycLockStatus === 'rejected'
                                        ? 'Re-upload Document'
                                        : 'Upload Document')))
                        }}
                      </ArgonButton>
                    </div>

                    <div v-if="kycLockStatus === 'approved'" class="mt-3 text-center">
                      <p class="text-sm text-success mb-0">
                        <i class="fas fa-info-circle me-1"></i>
                        This document has been approved and cannot be re-uploaded.
                      </p>
                    </div>
                    <div v-else-if="!hasAnyPending && kycLockStatus === 'rejected'" class="mt-3 text-center">
                      <p class="text-sm text-danger mb-0">
                        <i class="fas fa-exclamation-triangle me-1"></i>
                        Your document was rejected. Please upload a new one.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Status Section -->
              <div class="col-lg-4">
                <div class="status-card">
                  <h5 class="mb-3 text-dark fw-bold">
                    <i class="fas fa-info-circle me-1"></i>
                    Document Status
                  </h5>

                  <div v-if="loading" class="text-center py-4">
                    <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
                    <p class="mb-0 mt-2 text-sm text-muted">Loading status...</p>
                  </div>

                  <div v-else class="status-list">
                    <!-- Show pending document if available -->
                    <div v-if="hasAnyPending && pendingDocument" class="status-item-large">
                      <div class="text-center mb-3">
                        <div class="status-icon-large">
                          <i class="fas fa-clock text-warning"></i>
                        </div>
                      </div>
                      <div class="text-center">
                        <h6 class="mb-2 fw-bold text-dark">
                          {{ proofResidenceTypes.find(t => t.value === pendingDocument.document_type)?.label || pendingDocument.document_type }}
                        </h6>
                        <div class="mb-2">
                          <span class="badge badge-lg bg-warning">
                            <i class="fas fa-clock"></i>
                            Pending Review
                          </span>
                        </div>
                        <p 
                          v-if="pendingDocument.created_at" 
                          class="mb-0 text-xs text-muted"
                        >
                          <i class="fas fa-calendar me-1"></i>
                          Submitted: {{ formatDate(pendingDocument.created_at) }}
                        </p>
                      </div>
                    </div>
                    <!-- Show selected document type status if no pending -->
                    <div v-else-if="selectedType && currentDocType" class="status-item-large">
                      <div class="text-center mb-3">
                        <div class="status-icon-large">
                          <i class="fas" :class="currentDocType.icon"></i>
                        </div>
                      </div>
                      <div class="text-center">
                        <h6 class="mb-2 fw-bold text-dark">{{ currentDocType.label }}</h6>
                        <div class="mb-2">
                          <span 
                            class="badge badge-lg" 
                            :class="getStatusBadge(getDocumentStatus(selectedType)).class"
                          >
                            <i class="fas" :class="getStatusBadge(getDocumentStatus(selectedType)).icon"></i>
                            {{ getStatusBadge(getDocumentStatus(selectedType)).text }}
                          </span>
                        </div>
                        <p 
                          v-if="documents.find(d => d.document_type === selectedType)?.created_at" 
                          class="mb-0 text-xs text-muted"
                        >
                          <i class="fas fa-calendar me-1"></i>
                          Uploaded: {{ formatDate(documents.find(d => d.document_type === selectedType)?.created_at) }}
                        </p>
                        <p v-else class="mb-0 text-xs text-muted">
                          <i class="fas fa-info-circle me-1"></i>
                          Not uploaded yet
                        </p>
                      </div>
                    </div>

                    <!-- Show prompt if no document type selected -->
                    <div v-else class="text-center py-4">
                      <i class="fas fa-hand-pointer fa-2x text-muted mb-2" style="opacity: 0.3;"></i>
                      <p class="mb-0 text-sm text-muted">Select a document type to see status</p>
                    </div>
                  </div>
                  
                  <!-- Info Box -->
                  <div class="info-box mt-4">
                    <div class="d-flex">
                      <div class="info-icon">
                        <i class="fas fa-lightbulb"></i>
                      </div>
                      <div class="flex-grow-1">
                        <h6 class="mb-2 fw-bold text-dark">Requirements</h6>
                        <ul class="mb-0 text-xs">
                          <li>Recent document (last 3 months)</li>
                          <li>Must show your full name</li>
                          <li>Must show your address</li>
                          <li>Clear and readable</li>
                          <li>Max file size: 5MB</li>
                          <li>Accepted: JPG, PNG, WEBP, PDF</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
</template>

<style scoped>
.proof-of-residence-wrapper {
  width: 100%;
  padding: 0;
  margin: 0;
}
.upload-card,
.status-card {
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.document-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.doc-type-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 0.75rem;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s;
}

.doc-type-card:hover {
  border-color: #344767;
  background-color: #e9ecef;
  transform: translateY(-2px);
}

.doc-type-card.active {
  border-color: #344767;
  background-color: #344767;
  color: white;
}

.doc-type-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.doc-type-card.disabled:hover {
  transform: none;
}

.doc-type-card i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.doc-type-label {
  font-size: 0.875rem;
  font-weight: 700;
  text-align: center;
}

.selected-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 1.2rem;
}

.upload-section {
  margin-top: 1rem;
}

.upload-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #344767;
  margin-bottom: 0.5rem;
}

.upload-box-large {
  position: relative;
}

.file-input {
  display: none;
}

.upload-area-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  border: 2px dashed #cbd5e0;
  border-radius: 0.75rem;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s;
  margin: 0;
  min-height: 300px;
}

.upload-area-large:hover {
  border-color: #344767;
  background-color: #e9ecef;
}

.upload-area-large.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.upload-area-large.disabled:hover {
  border-color: #cbd5e0;
  background-color: #f8f9fa;
}

.preview-container-large {
  position: relative;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  overflow: hidden;
  background-color: #f8f9fa;
  min-height: 300px;
}

.preview-image-large {
  width: 100%;
  height: 300px;
  object-fit: contain;
  display: block;
  padding: 1rem;
}

.pdf-preview-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  min-height: 300px;
}

.remove-btn-large {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(220, 53, 69, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.remove-btn-large:hover {
  background-color: #dc3545;
  transform: scale(1.1);
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-item-large {
  padding: 2rem 1rem;
  background-color: #f8f9fa;
  border-radius: 0.75rem;
  border: 2px solid #e9ecef;
}

.status-icon-large {
  width: 5rem;
  height: 5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 0.75rem;
  font-size: 2.5rem;
  color: #344767;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-box {
  background-color: #e7f5ff;
  border: 1px solid #339af0;
  border-radius: 0.5rem;
  padding: 1rem;
}

.info-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #339af0;
  margin-right: 0.75rem;
  font-size: 1.2rem;
}

.info-box ul {
  padding-left: 1.25rem;
  margin: 0;
}

.info-box li {
  margin-bottom: 0.25rem;
  color: #495057;
}

.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.875rem;
}

.badge {
  font-size: 0.7rem;
  padding: 0.35rem 0.65rem;
  font-weight: 600;
}

.badge-lg {
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
  font-weight: 600;
}

.badge i {
  margin-right: 0.25rem;
  font-size: 0.65rem;
}

.card {
  background-color: white;
  border-radius: 0.75rem;
}

@media (max-width: 768px) {
  .upload-card,
  .status-card {
    padding: 1rem;
  }
  
  .document-type-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .upload-area-large {
    padding: 2rem 1rem;
    min-height: 250px;
  }
  
  .preview-container-large,
  .preview-image-large {
    min-height: 250px;
  }
}
</style>