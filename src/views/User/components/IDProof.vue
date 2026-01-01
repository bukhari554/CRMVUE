<script setup>
import { ref, computed } from 'vue';
import { apiGet, apiPost } from '@/utils/api.js';
import ArgonButton from '@/components/ArgonButton.vue';

const loading = ref(false);
const submitting = ref(false);
const documents = ref([]);
const message = ref('');
const messageType = ref('');

// Model-aligned constants
const CATEGORY_PROOF_OF_ID = 'proof_of_id';

const selectedDocType = ref('driver_license');
const frontImage = ref(null);
const backImage = ref(null);
const frontPreview = ref(null);
const backPreview = ref(null);

// Document types (aligned to UserDocument model)
const documentCategories = [
  {
    id: 'driver_license',
    label: 'Driving License',
    title: 'Driving License',
    icon: 'fa-car',
    requiresBack: true,
  },
  {
    id: 'national_id',
    label: 'National ID',
    title: 'National ID',
    icon: 'fa-id-card',
    requiresBack: true,
  },
  {
    id: 'passport',
    label: 'Passport',
    title: 'Passport',
    icon: 'fa-passport',
    requiresBack: false, // Passport doesn't need back image
  },
];

const currentCategory = computed(() => {
  return documentCategories.find(cat => cat.id === selectedDocType.value);
});

// Check if back image is required based on document type
const isBackImageRequired = computed(() => {
  return currentCategory.value?.requiresBack || false;
});

// Check if any file is selected
const isFileSelected = computed(() => {
  return frontImage.value !== null || backImage.value !== null;
});

// Check if ANY document in the category has pending status
const hasAnyPending = computed(() => {
  return documents.value.some(d => (d?.status || '').toLowerCase() === 'pending');
});

// Get the pending document if available
const pendingDocument = computed(() => {
  return documents.value.find(d => (d?.status || '').toLowerCase() === 'pending');
});

// KYC rule: allow upload only when the current Proof-of-ID is NOT uploaded OR REJECTED.
// If it's PENDING or APPROVED, uploads are blocked.
// Check status for the currently selected document type
const kycLockStatus = computed(() => {
  // If ANY document is pending, lock everything
  if (hasAnyPending.value) {
    return 'pending';
  }
  
  const currentDoc = documents.value.find(d => d.document_type === selectedDocType.value);
  if (!currentDoc) return null;
  
  const status = (currentDoc?.status || '').toLowerCase();
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return null;
});

// Check if a specific document type is disabled
const isDocTypeDisabled = (docTypeId) => {
  // If file is selected, disable other types
  if (isFileSelected.value && docTypeId !== selectedDocType.value) {
    return true;
  }

  // If ANY document is pending, disable ALL tabs
  if (hasAnyPending.value) {
    return true;
  }

  // If the specific document type is approved, disable it
  const docStatus = documents.value.find(d => d.document_type === docTypeId)?.status?.toLowerCase();
  if (docStatus === 'approved') {
    return true;
  }

  return false;
};

// Check if upload button should be disabled
const isUploadDisabled = computed(() => {
  if (submitting.value) return true;
  if (!frontImage.value) return true;
  if (isBackImageRequired.value && !backImage.value) return true;

  // If ANY document is pending, disable upload
  if (hasAnyPending.value) return true;
  
  // Do not allow upload when current document is approved
  if (kycLockStatus.value === 'approved') return true;
  
  return false;
});

// Check if file inputs should be disabled
const isFileInputDisabled = computed(() => {
  // If ANY document is pending, disable all inputs
  if (hasAnyPending.value) return true;
  
  // Disable when submitting or current document is approved
  return submitting.value || kycLockStatus.value === 'approved';
});

// Get button text based on status
const getUploadButtonText = computed(() => {
  if (submitting.value) return 'Uploading...';

  // If ANY document is pending, show pending message
  if (hasAnyPending.value) {
    const pendingDoc = pendingDocument.value;
    const pendingType = documentCategories.find(cat => cat.id === pendingDoc?.document_type);
    return pendingType ? `${pendingType.title} Pending Review` : 'Document Pending Review';
  }

  if (kycLockStatus.value === 'approved') {
    return `${currentCategory.value.title} Already Approved`;
  }
  
  if (kycLockStatus.value === 'rejected') {
    return `Re-upload ${currentCategory.value.title}`;
  }
  
  return `Upload ${currentCategory.value.title}`;
});

// API: Load documents (from first code logic)
const loadDocuments = async () => {
  loading.value = true;
  try {
    // Prefer model-aligned endpoint; fallback to legacy endpoints if not available
    let response = await apiGet(`/client/documents?category=${encodeURIComponent(CATEGORY_PROOF_OF_ID)}`);
    if (!response.ok && (response.status === 404 || response.status === 405)) {
      response = await apiGet('/client/documents/proof-of-id');
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

    // Normalize legacy types to model-aligned types
    documents.value = (Array.isArray(docs) ? docs : []).map((d) => {
      if (!d) return d;
      const t = (d.document_type || '').toLowerCase();
      if (t === 'cnic') return { ...d, document_type: 'national_id' };
      return d;
    });
  } catch (error) {
    console.error('Failed to load proof of ID documents:', error);
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

const handleFileSelect = (event, side) => {
  // Don't allow file selection if document is approved or already uploaded
  if (isFileInputDisabled.value) {
    event.preventDefault();
    return;
  }

  const file = event.target.files[0];
  if (!file) return;

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    showMessage('File size must be less than 5MB', 'error');
    event.target.value = '';
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    showMessage('Only JPG, PNG, and JPEG files are allowed', 'error');
    event.target.value = '';
    return;
  }

  if (side === 'front') {
    frontImage.value = file;
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        frontPreview.value = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      frontPreview.value = 'pdf';
    }
  } else {
    backImage.value = file;
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        backPreview.value = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      backPreview.value = 'pdf';
    }
  }
};

const removeFile = (side) => {
  // Don't allow removing files if document is approved or already uploaded
  if (isFileInputDisabled.value) {
    return;
  }

  if (side === 'front') {
    frontImage.value = null;
    frontPreview.value = null;
    const input = document.getElementById('front-image-input');
    if (input) input.value = '';
  } else {
    backImage.value = null;
    backPreview.value = null;
    const input = document.getElementById('back-image-input');
    if (input) input.value = '';
  }
};

const handleDocTypeChange = (docTypeId) => {
  // Don't allow changing if disabled
  if (isDocTypeDisabled(docTypeId)) {
    return;
  }
  
  selectedDocType.value = docTypeId;
  clearForm();
};

const clearForm = () => {
  frontImage.value = null;
  backImage.value = null;
  frontPreview.value = null;
  backPreview.value = null;
  
  const frontInput = document.getElementById('front-image-input');
  const backInput = document.getElementById('back-image-input');
  if (frontInput) frontInput.value = '';
  if (backInput) backInput.value = '';
};

// API: Submit document (using first code's JSON format)
const submitDocument = async () => {
  // Double check if button should be disabled
  if (isUploadDisabled.value) {
    return;
  }

  if (!frontImage.value) {
    showMessage('Please select front image', 'error');
    return;
  }

  if (isBackImageRequired.value && !backImage.value) {
    showMessage('Please select both front and back images', 'error');
    return;
  }

  submitting.value = true;

  try {
    // Model-aligned: category, document_type, front_image, back_image
    const formData = new FormData();
    formData.append('category', CATEGORY_PROOF_OF_ID);
    formData.append('document_type', selectedDocType.value);
    formData.append('front_image', frontImage.value);
    
    // Only append back_image if required AND provided
    if (isBackImageRequired.value && backImage.value) {
      formData.append('back_image', backImage.value);
    }

    // Prefer model-aligned endpoint; fallback to legacy endpoint if not available
    // Use silent: true for first attempt to suppress error toast if it fails (we have a fallback)
    let response = await apiPost('/client/documents', formData, { silent: true });
    if (!response.ok && (response.status === 404 || response.status === 405)) {
      // Legacy endpoint may not accept category field; rebuild without it
      const legacyForm = new FormData();
      legacyForm.append('document_type', selectedDocType.value);
      legacyForm.append('front_image', frontImage.value);
      if (isBackImageRequired.value && backImage.value) {
        legacyForm.append('back_image', backImage.value);
      }
      // Second attempt - show toast normally since this is the final attempt
      response = await apiPost('/client/documents/proof-of-id', legacyForm);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || 'Failed to upload document');
    }
    
    const data = await response.json().catch(() => ({}));

    if (data?.success || response.ok) {
      showMessage(`${currentCategory.value.title} uploaded successfully!`, 'success');
      clearForm();
      await loadDocuments();
    } else {
      throw new Error(data?.message || 'Failed to upload document');
    }
  } catch (error) {
    console.error('Document upload error:', error);
    showMessage(error.message || 'Failed to upload document. Please try again.', 'error');
  } finally {
    submitting.value = false;
  }
};

const showMessage = (msg, type) => {
  message.value = msg;
  messageType.value = type;
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
  documents.value = (Array.isArray(docs) ? docs : []).map((d) => {
    if (!d) return d;
    const t = (d.document_type || '').toLowerCase();
    if (t === 'cnic') return { ...d, document_type: 'national_id' };
    return d;
  });
  loading.value = false;
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
      <div class="proof-of-id-wrapper">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-4">
            <div class="mb-4">
              <h4 class="mb-1 text-dark fw-bold">
                <i class="fas fa-id-card-alt me-2"></i>
                Proof of Identity
              </h4>
              <p class="text-sm text-muted mb-0">Upload your identity verification documents</p>
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
                        v-for="category in documentCategories" 
                        :key="category.id"
                        class="doc-type-card"
                        :class="{ 
                          'active': selectedDocType === category.id,
                          'disabled': isDocTypeDisabled(category.id)
                        }"
                        @click="handleDocTypeChange(category.id)"
                      >
                        <i class="fas" :class="category.icon"></i>
                        <span class="doc-type-label">{{ category.label }}</span>
                        <div v-if="selectedDocType === category.id && !isDocTypeDisabled(category.id)" class="selected-indicator">
                          <i class="fas fa-check-circle"></i>
                        </div>
                        <div v-if="getDocumentStatus(category.id) === 'approved'" class="approved-badge">
                          <i class="fas fa-check-circle"></i>
                          <span>Approved</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- File Upload Section -->
                  <div class="upload-section">
                    <div class="row g-3">
                      <!-- Front Image -->
                      <div :class="isBackImageRequired ? 'col-md-6' : 'col-12'">
                        <label class="upload-label">
                          <i class="fas fa-image me-1"></i>
                          {{ isBackImageRequired ? 'Front Image' : 'Passport Image' }}
                        </label>
                        
                        <div v-if="frontPreview" class="preview-container">
                          <div v-if="frontPreview === 'pdf'" class="pdf-preview">
                            <i class="fas fa-file-pdf fa-3x text-danger"></i>
                            <p class="mb-0 mt-2 text-sm fw-bold">{{ frontImage?.name }}</p>
                          </div>
                          <img v-else :src="frontPreview" alt="Front preview" class="preview-image">
                          <button 
                            @click="removeFile('front')" 
                            class="remove-btn" 
                            type="button"
                            :disabled="isFileInputDisabled"
                          >
                            <i class="fas fa-times"></i>
                          </button>
                        </div>
                        
                        <div v-else class="upload-box">
                          <input
                            type="file"
                            id="front-image-input"
                            @change="handleFileSelect($event, 'front')"
                            accept="image/jpeg,image/jpg,image/png,application/pdf"
                            class="file-input"
                            :disabled="isFileInputDisabled"
                          >
                          <label 
                            for="front-image-input" 
                            class="upload-area"
                            :class="{ 'disabled': isFileInputDisabled }"
                          >
                            <i class="fas fa-cloud-upload-alt fa-3x mb-2 text-primary"></i>
                            <p class="mb-0 text-sm fw-bold">
                              {{ isBackImageRequired ? 'Click to upload front image' : 'Click to upload passport' }}
                            </p>
                            <p class="mb-0 text-xs text-muted">JPG, PNG and JPEG (max 5MB)</p>
                          </label>
                        </div>
                      </div>

                      <!-- Back Image (only show if required) -->
                      <div v-if="isBackImageRequired" class="col-md-6">
                        <label class="upload-label">
                          <i class="fas fa-image me-1"></i>
                          Back Image
                        </label>
                        
                        <div v-if="backPreview" class="preview-container">
                          <div v-if="backPreview === 'pdf'" class="pdf-preview">
                            <i class="fas fa-file-pdf fa-3x text-danger"></i>
                            <p class="mb-0 mt-2 text-sm fw-bold">{{ backImage?.name }}</p>
                          </div>
                          <img v-else :src="backPreview" alt="Back preview" class="preview-image">
                          <button 
                            @click="removeFile('back')" 
                            class="remove-btn" 
                            type="button"
                            :disabled="isFileInputDisabled"
                          >
                            <i class="fas fa-times"></i>
                          </button>
                        </div>
                        
                        <div v-else class="upload-box">
                          <input
                            type="file"
                            id="back-image-input"
                            @change="handleFileSelect($event, 'back')"
                            accept="image/jpeg,image/jpg,image/png,application/pdf"
                            class="file-input"
                            :disabled="isFileInputDisabled"
                          >
                          <label 
                            for="back-image-input" 
                            class="upload-area"
                            :class="{ 'disabled': isFileInputDisabled }"
                          >
                            <i class="fas fa-cloud-upload-alt fa-3x mb-2 text-primary"></i>
                            <p class="mb-0 text-sm fw-bold">Click to upload back image</p>
                            <p class="mb-0 text-xs text-muted">Required for this document</p>
                          </label>
                        </div>
                      </div>
                    </div>

                    <!-- Submit Button -->
                    <div class="mt-4">
                      <ArgonButton
                        color="dark"
                        variant="gradient"
                        size="lg"
                        class="w-100"
                        :disabled="isUploadDisabled"
                        @click="submitDocument"
                      >
                        <i class="fas" :class="submitting ? 'fa-spinner fa-spin' : getDocumentStatus(selectedDocType) === 'approved' ? 'fa-check-circle' : 'fa-upload'"></i>
                        {{ getUploadButtonText }}
                      </ArgonButton>
                    </div>

                    <!-- Status Message under button -->
                    <div v-if="getDocumentStatus(selectedDocType) === 'approved'" class="mt-3 text-center">
                      <p class="text-sm text-success mb-0">
                        <i class="fas fa-info-circle me-1"></i>
                        This document has been approved and cannot be re-uploaded.
                      </p>
                    </div>
                    <div v-else-if="!hasAnyPending && getDocumentStatus(selectedDocType) === 'rejected'" class="mt-3 text-center">
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
                          {{ documentCategories.find(cat => cat.id === pendingDocument.document_type)?.title || pendingDocument.document_type }}
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
                    <div v-else class="status-item-large">
                      <div class="text-center mb-3">
                        <div class="status-icon-large">
                          <i class="fas" :class="currentCategory.icon"></i>
                        </div>
                      </div>
                      <div class="text-center">
                        <h6 class="mb-2 fw-bold text-dark">{{ currentCategory.title }}</h6>
                        <div class="mb-2">
                          <span 
                            class="badge badge-lg" 
                            :class="getStatusBadge(getDocumentStatus(selectedDocType)).class"
                          >
                            <i class="fas" :class="getStatusBadge(getDocumentStatus(selectedDocType)).icon"></i>
                            {{ getStatusBadge(getDocumentStatus(selectedDocType)).text }}
                          </span>
                        </div>
                        <p 
                          v-if="documents.find(d => d.document_type === selectedDocType)?.created_at" 
                          class="mb-0 text-xs text-muted"
                        >
                          <i class="fas fa-calendar me-1"></i>
                          Uploaded: {{ formatDate(documents.find(d => d.document_type === selectedDocType)?.created_at) }}
                        </p>
                        <p v-else class="mb-0 text-xs text-muted">
                          <i class="fas fa-info-circle me-1"></i>
                          Not uploaded yet
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Info Box -->
                  <div class="info-box mt-4">
                    <div class="d-flex">
                      <div class="info-icon">
                        <i class="fas fa-info-circle"></i>
                      </div>
                      <div class="flex-grow-1">
                        <h6 class="mb-2 fw-bold text-dark">Requirements</h6>
                        <ul class="mb-0 text-xs">
                          <li>Upload clear, readable images</li>
                          <li v-if="isBackImageRequired">Front and back images required</li>
                          <li v-else>Single passport image required</li>
                          <li>Max file size: 5MB</li>
                          <li>Accepted: JPG, PNG and JPEG</li>
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
.proof-of-id-wrapper {
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

.doc-type-card:hover:not(.disabled) {
  border-color: #344767;
  background-color: #e9ecef;
  transform: translateY(-2px);
}

.doc-type-card.active:not(.disabled) {
  border-color: #344767;
  background-color: #344767;
  color: white;
}

.doc-type-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  background-color: #e9ecef;
}

.doc-type-card.disabled.active {
  opacity: 0.5;
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

.approved-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: #28a745;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.65rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.approved-badge i {
  font-size: 0.65rem;
  margin: 0;
}

.upload-section {
  margin-top: 1.5rem;
}

.upload-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #344767;
  margin-bottom: 0.5rem;
}

.upload-box {
  position: relative;
}

.file-input {
  display: none;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;
  border: 2px dashed #cbd5e0;
  border-radius: 0.75rem;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s;
  margin: 0;
  min-height: 220px;
}

.upload-area:not(.disabled):hover {
  border-color: #344767;
  background-color: #e9ecef;
}

.upload-area.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  background-color: #e9ecef;
}

.preview-container {
  position: relative;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  overflow: hidden;
  background-color: #f8f9fa;
  min-height: 220px;
}

.preview-image {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}

.pdf-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  min-height: 220px;
}

.remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
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

.remove-btn:hover:not(:disabled) {
  background-color: #dc3545;
  transform: scale(1.1);
}

.remove-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-item {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  border: 1px solid #e9ecef;
}

.status-item-large {
  padding: 2rem 1rem;
  background-color: #f8f9fa;
  border-radius: 0.75rem;
  border: 2px solid #e9ecef;
}

.status-icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 0.5rem;
  margin-right: 1rem;
  font-size: 1.5rem;
  color: #344767;
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
  .document-type-grid {
    grid-template-columns: 1fr;
  }
}
</style>