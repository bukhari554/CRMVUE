<script setup>
import { ref, onMounted, nextTick } from 'vue';
import ProofOfID from '@/views/User/components/IDProof.vue';
import ProofOfResidence from '@/views/User/components/ResidenceProof.vue';
import Table from '@/components/Table.vue';
import ArgonButton from '@/components/ArgonButton.vue';
import { apiGet } from '@/utils/api.js';

const proofOfIDRef = ref(null);
const proofOfResidenceRef = ref(null);

const allDocuments = ref([]);
const loadingDocuments = ref(false);
const showImageModal = ref(false);
const viewingDocument = ref(null);

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

const categoryLabels = {
  proof_of_id: "Proof of Identity",
  proof_of_residence: "Proof of Residence",
};

const refreshAll = async () => {
  await loadAllDocuments();
  // After loading, refresh child components
  if (proofOfIDRef.value) {
    proofOfIDRef.value.loadDocuments();
  }
  if (proofOfResidenceRef.value) {
    proofOfResidenceRef.value.loadDocuments();
  }
};

const loadAllDocuments = async () => {
  loadingDocuments.value = true;
  try {
    const response = await apiGet('/client/documents?per_page=1000');
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

    // Normalize legacy types
    allDocuments.value = (Array.isArray(docs) ? docs : []).map((d) => {
      if (!d) return d;
      const t = (d.document_type || '').toLowerCase();
      if (t === 'cnic') return { ...d, document_type: 'national_id' };
      return d;
    });

    // Update child components with filtered data (wait for next tick to ensure refs are available)
    await nextTick();
    if (proofOfIDRef.value && proofOfIDRef.value.setDocuments) {
      const proofIdDocs = allDocuments.value.filter(d => 
        d.category === 'proof_of_id' || 
        ['driver_license', 'passport', 'national_id', 'cnic'].includes(d.document_type)
      );
      proofOfIDRef.value.setDocuments(proofIdDocs);
    }
    if (proofOfResidenceRef.value && proofOfResidenceRef.value.setDocuments) {
      const proofResidenceDocs = allDocuments.value.filter(d => 
        d.category === 'proof_of_residence' || 
        ['bank_statement', 'rent_agreement', 'utility_bill', 'wire_transfer_proof'].includes(d.document_type)
      );
      proofOfResidenceRef.value.setDocuments(proofResidenceDocs);
    }
  } catch (error) {
    console.error('Failed to load all documents:', error);
    allDocuments.value = [];
  } finally {
    loadingDocuments.value = false;
  }
};

const getStatusBadgeClass = (status) => {
  const s = (status || "pending").toLowerCase();
  if (s === "approved") return "badge bg-success";
  if (s === "rejected") return "badge bg-danger";
  if (s === "pending") return "badge bg-warning";
  return "badge bg-secondary";
};

const getStatusText = (status) => {
  const s = (status || "pending").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

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

  if (front && !back) {
    window.open(front, "_blank");
    return true;
  }

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
  // For Proof of Residence, open in new browser window/tab
  if (doc.category === "proof_of_residence" || 
      ['bank_statement', 'rent_agreement', 'utility_bill', 'wire_transfer_proof'].includes(doc.document_type)) {
    const opened = openDocumentInNewWindow(doc);
    if (opened) return;
  }

  // For Proof of ID, show in popup modal
  viewingDocument.value = doc;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  viewingDocument.value = null;
};

const tableColumns = [
  { key: 'category', label: 'Category' },
  { key: 'document_type', label: 'Document Type' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Submitted Date' },
  { key: 'actions', label: 'Actions' },
];

onMounted(async () => {
  // Load all documents once - this will also update child components
  await loadAllDocuments();
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-12">
        <!-- Header Card -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body p-4">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h4 class="mb-1 text-dark fw-bold">
                  <i class="fas fa-file-upload me-2"></i>
                  KYC Documents
                </h4>
                <p class="text-sm text-muted mb-0">Complete your identity verification process</p>
              </div>
              <button 
                @click="refreshAll" 
                class="btn btn-sm btn-kyc-refresh"
                title="Refresh all documents"
              >
                <i class="fas fa-sync-alt me-1"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <!-- Submitted Documents Table -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body p-4">
            <h5 class="mb-3 text-dark fw-bold">
              <i class="fas fa-list me-2"></i>
              Submitted Documents
            </h5>
            <Table
              :columns="tableColumns"
              :data="allDocuments"
              :loading="loadingDocuments"
              loading-text="Loading documents..."
              empty-text="No documents submitted yet."
            >
              <template #cell-category="{ row }">
                <span class="fw-semibold">
                  {{ categoryLabels[row.category] || row.category || '—' }}
                </span>
              </template>

              <template #cell-document_type="{ row }">
                {{ documentTypeLabels[row.document_type] || row.document_type || '—' }}
              </template>

              <template #cell-status="{ row }">
                <span :class="getStatusBadgeClass(row.status)">
                  {{ getStatusText(row.status) }}
                </span>
              </template>

              <template #cell-created_at="{ row }">
                {{ formatDate(row.created_at) }}
              </template>

              <template #cell-actions="{ row }">
                <ArgonButton
                  color="info"
                  size="sm"
                  @click="viewDocument(row)"
                  :disabled="!row.front_image_url"
                >
                  <i class="fas fa-eye me-1"></i>
                  View
                </ArgonButton>
              </template>
            </Table>
          </div>
        </div>

        <!-- Proof of ID Section - Full Width Wrapper -->
        <div class="full-width-wrapper mb-4">
          <ProofOfID ref="proofOfIDRef" />
        </div>

        <!-- Proof of Residence Section - Full Width Wrapper -->
        <div class="full-width-wrapper mb-2">
          <ProofOfResidence ref="proofOfResidenceRef" />
        </div>
      </div>
    </div>

    <!-- Image Modal for ID Verification -->
    <div
      v-if="showImageModal && viewingDocument"
      class="doc-modal-backdrop"
      @click.self="closeImageModal"
    >
      <div class="image-modal">
        <div class="image-modal-header">
          <h5 class="mb-0">
            {{ documentTypeLabels[viewingDocument.document_type] || viewingDocument.document_type || 'Document' }}
          </h5>
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
.card {
  background-color: white;
  border-radius: 0.75rem;
}

.text-sm {
  font-size: 0.875rem;
}

/* Updated Refresh Button */
.btn-kyc-refresh {
  background-color: #111111;
  color: #ffffff;
  border-radius: 6px;
  font-weight: 600;
  padding: 6px 14px;
  border: none;
}

.btn-kyc-refresh:hover {
  background-color: #222222;
  color: #ffffff;
}

/* Image Modal Styles */
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

<!-- Global unscoped style -->
<style>
/* Target all direct children of col-12 to be full width */
.col-12 > div:not(.card) {
  width: 100% !important;
}

/* Force any nested cards to be full width */
.col-12 > div:not(.card) .card {
  width: 100% !important;
  max-width: none !important;
}

/* Remove container max-width inside imported components */
.col-12 > div:not(.card) .container {
  max-width: none !important;
  width: 100% !important;
}
</style>
