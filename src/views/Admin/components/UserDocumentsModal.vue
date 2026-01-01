<script setup>
import { ref, computed, watch } from 'vue';
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

const activeCategory = ref('proof_of_id');
const submitting = ref({});
const errorMessage = ref('');
const successMessage = ref('');

const documentTypeLabels = {
  driver_license: "Driver's License",
  passport: "Passport",
  national_id: "National ID",
  cnic: "CNIC",
  bank_statement: "Bank Statement",
  rent_agreement: "Rent Agreement",
  utility_bill: "Utility Bill",
  wire_transfer_proof: "Wire Transfer Proof",
};

const filteredDocuments = computed(() => {
  const userId = props.user?.id ?? null;
  if (!Array.isArray(props.documents)) return [];
  if (!userId) return props.documents;
  return props.documents.filter((d) => {
    const docUserId = d?.user_id ?? d?.user?.id ?? null;
    // eslint-disable-next-line eqeqeq
    return docUserId != null && docUserId == userId;
  });
});

const proofIdDocuments = computed(() => {
  return filteredDocuments.value.filter(doc => {
    const category = doc.category || '';
    return category === 'proof_of_id' || 
           ['driver_license', 'passport', 'national_id', 'cnic'].includes(doc.document_type);
  });
});

const proofResidenceDocuments = computed(() => {
  return filteredDocuments.value.filter(doc => {
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

const getStatusBadgeClass = (status) => {
  const s = (status || "pending").toLowerCase();
  if (s === "approved") return "badge bg-success";
  if (s === "rejected") return "badge bg-danger";
  if (s === "pending") return "badge bg-warning";
  return "badge bg-secondary";
};

const getStatusText = (status) => {
  const s = (status || "pending").toLowerCase();
  if (s === "not_submitted") return "Not Submitted";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const handleStatusUpdate = async (document, status) => {
  if (!document || !document.id) {
    errorMessage.value = 'Invalid document. Please refresh and try again.';
    setTimeout(() => { errorMessage.value = ''; }, 3000);
    return;
  }

  if (status !== 'approved' && status !== 'rejected') {
    errorMessage.value = 'Invalid status. Please select Approved or Rejected.';
    setTimeout(() => { errorMessage.value = ''; }, 3000);
    return;
  }

  if (submitting.value[document.id]) {
    console.log('Already processing document:', document.id);
    return;
  }

  submitting.value = { ...submitting.value, [document.id]: true };
  errorMessage.value = '';
  successMessage.value = '';

  try {
    console.log(`Updating document ${document.id} to status: ${status}`);
    
    const payload = { status };
    const response = await apiPatch(`/admin/documents/${document.id}/status`, payload);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.message || 
                      (errorData?.errors && Object.values(errorData.errors).flat().join(', ')) ||
                      `Failed to update document status (${response.status})`;
      throw new Error(errorMsg);
    }

    const data = await response.json().catch(() => ({}));
    
    console.log('Document updated successfully:', data);
    successMessage.value = data?.message || `Document ${status} successfully!`;
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    emit('document-updated');
    
    setTimeout(() => {
      successMessage.value = '';
    }, 2500);
    
  } catch (err) {
    console.error('Error updating document status:', err);
    errorMessage.value = err.message || 'Unable to update document status. Please try again.';
    
    setTimeout(() => {
      errorMessage.value = '';
    }, 4000);
  } finally {
    submitting.value = { ...submitting.value, [document.id]: false };
  }
};

const selectCategory = (category) => {
  activeCategory.value = category;
  errorMessage.value = '';
  successMessage.value = '';
};

const closeModal = () => {
  emit('update:show', false);
  activeCategory.value = 'proof_of_id';
  errorMessage.value = '';
  successMessage.value = '';
  submitting.value = {};
};

const showImageModal = ref(false);
const viewingDocument = ref(null);

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const openDocumentInNewWindow = (doc) => {
  const front = doc?.front_image_url || null;
  const back = doc?.back_image_url || null;

  // If only one url exists, just open it directly.
  if (front && !back) {
    window.open(front, "_blank");
    return true;
  }

  // If both exist (or only back exists), open a simple preview page in a new window.
  const win = window.open("", "_blank");
  if (!win) return false;

  const title = documentTypeLabels?.[doc?.document_type] || doc?.document_type || "Document";
  const safeTitle = escapeHtml(title);

  const imagesHtml = [
    front
      ? `<section class="card"><h2>Front</h2><img src="${escapeHtml(front)}" alt="Front document" /></section>`
      : "",
    back
      ? `<section class="card"><h2>Back</h2><img src="${escapeHtml(back)}" alt="Back document" /></section>`
      : "",
  ].filter(Boolean).join("");

  win.document.open();
  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${safeTitle}</title>
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; background: #f6f7fb; color: #111; }
          header { padding: 14px 16px; background: #fff; border-bottom: 1px solid #e9ecef; position: sticky; top: 0; }
          header h1 { margin: 0; font-size: 16px; font-weight: 700; }
          main { padding: 16px; display: grid; gap: 16px; }
          .card { background: #fff; border: 1px solid #e9ecef; border-radius: 10px; padding: 12px; }
          .card h2 { margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #344767; }
          img { width: 100%; height: auto; max-height: 80vh; object-fit: contain; border: 1px solid #dee2e6; border-radius: 8px; background: #fff; }
        </style>
      </head>
      <body>
        <header><h1>${safeTitle}</h1></header>
        <main>${imagesHtml || "<p>No document image available.</p>"}</main>
      </body>
    </html>
  `);
  win.document.close();

  return true;
};

const viewDocument = (doc) => {
  // Admin requirement: for Proof of Residence only, open in new browser window/tab.
  if (activeCategory.value === "proof_of_residence") {
    const opened = openDocumentInNewWindow(doc);
    if (opened) return;
    // Fallback if popups are blocked
  }

  viewingDocument.value = doc;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  viewingDocument.value = null;
};

watch(() => props.show, (newVal) => {
  if (!newVal) {
    errorMessage.value = '';
    successMessage.value = '';
    submitting.value = {};
  }
});
</script>

<template>
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
        <div class="doc-modal-sidebar">
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

        <div class="doc-modal-main">
          <div class="p-4">
            <div class="d-flex align-items-center mb-3">
              <h6 class="mb-0 me-2">
                {{ activeCategory === 'proof_of_id' ? 'Proof of ID' : 'Proof of Residence' }}
              </h6>
              <i class="fas fa-info-circle text-muted" style="font-size: 14px;"></i>
            </div>

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

            <div v-if="errorMessage" class="alert alert-danger mb-3">
              <i class="fas fa-exclamation-circle me-2"></i>
              {{ errorMessage }}
            </div>
            <div v-if="successMessage" class="alert alert-success mb-3">
              <i class="fas fa-check-circle me-2"></i>
              {{ successMessage }}
            </div>

            <div v-if="loading" class="text-center text-muted py-5">
              <i class="fas fa-spinner fa-spin me-2"></i>
              Loading documents...
            </div>

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
                          <i v-if="submitting[doc.id]" class="fas fa-spinner fa-spin"></i>
                          {{ submitting[doc.id] ? 'Processing...' : 'Approve' }}
                        </ArgonButton>
                        <ArgonButton
                          v-if="doc.status !== 'rejected'"
                          color="danger"
                          size="sm"
                          :disabled="submitting[doc.id]"
                          @click="handleStatusUpdate(doc, 'rejected')"
                        >
                          <i v-if="submitting[doc.id]" class="fas fa-spinner fa-spin"></i>
                          {{ submitting[doc.id] ? 'Processing...' : 'Reject' }}
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
            <div class="image-container">
              <h6 class="text-center mb-2">Front</h6>
              <img
                v-if="viewingDocument.front_image_url"
                :src="viewingDocument.front_image_url"
                alt="Front Document"
                class="document-image"
              />
            </div>
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