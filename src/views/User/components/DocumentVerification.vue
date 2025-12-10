<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import ArgonButton from "@/components/ArgonButton.vue";
import { apiGet, apiPost } from "@/utils/api.js";

// -------------------- state --------------------
const proofIdDocuments = ref([]);
const proofResidenceDocuments = ref([]);
const loading = ref(false);
const uploading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const showModal = ref(false);
const activeCategory = ref("proof_of_id"); // 'proof_of_id', 'proof_of_residence'

// upload form
const selectedType = ref("");
const frontFile = ref(null);
const backFile = ref(null);
const frontFileInput = ref(null);
const backFileInput = ref(null);

// image viewer
const showImageModal = ref(false);
const viewingDocument = ref(null);

// -------------------- config --------------------
// Document types for Proof of ID
const proofIdTypes = [
  { value: "driver_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID" },
];

// Document types for Proof of Residence
const proofResidenceTypes = [
  { value: "bank_statement", label: "Bank Statement" },
  { value: "rent_agreement", label: "Rent Agreement" },
  { value: "utility_bill", label: "Utility Bill" },
  { value: "wire_transfer_proof", label: "Wire Transfer Proof" },
];

// Document type label mapping
const documentTypeLabels = {
  driver_license: "Driver's License",
  passport: "Passport",
  national_id: "National ID",
  bank_statement: "Bank Statement",
  rent_agreement: "Rent Agreement",
  utility_bill: "Utility Bill",
  wire_transfer_proof: "Wire Transfer Proof",
};

// -------------------- computed --------------------
const currentDocuments = computed(() => {
  if (activeCategory.value === "proof_of_id") {
    return proofIdDocuments.value;
  } else if (activeCategory.value === "proof_of_residence") {
    return proofResidenceDocuments.value;
  }
  return [];
});

const currentDocumentTypes = computed(() => {
  if (activeCategory.value === "proof_of_id") {
    return proofIdTypes;
  } else if (activeCategory.value === "proof_of_residence") {
    return proofResidenceTypes;
  }
  return [];
});

const missingProofId = computed(() => proofIdDocuments.value.length === 0);
const missingProofResidence = computed(() => proofResidenceDocuments.value.length === 0);

// Get status for Proof of ID
const proofIdStatus = computed(() => {
  if (proofIdDocuments.value.length === 0) return "not_submitted";
  const doc = proofIdDocuments.value[0];
  return doc.status || "pending";
});

// Get status for Proof of Residence
const proofResidenceStatus = computed(() => {
  if (proofResidenceDocuments.value.length === 0) return "not_submitted";
  const doc = proofResidenceDocuments.value[0];
  return doc.status || "pending";
});

const currentStatus = computed(() => {
  if (activeCategory.value === "proof_of_id") {
    return proofIdStatus.value;
  } else if (activeCategory.value === "proof_of_residence") {
    return proofResidenceStatus.value;
  }
  return "not_submitted";
});

const isApproved = computed(() => currentStatus.value === "approved");
const isPending = computed(() => currentStatus.value === "pending");

// Check if back image is required (not required for passport in proof of ID)
const isBackImageRequired = computed(() => {
  if (activeCategory.value === "proof_of_id") {
    // Back image is NOT required for passport, but required for other types
    return selectedType.value !== "passport";
  }
  // Proof of residence doesn't need back image
  return false;
});

// -------------------- api --------------------
const loadProofIdDocuments = async () => {
  try {
    const response = await apiGet("/client/documents/proof-of-id");
    const data = await response.json().catch(() => null);

    let docs = [];
    if (data?.success && data?.data?.documents) {
      docs = data.data.documents;
    } else if (data?.data?.documents) {
      docs = data.data.documents;
    } else if (data?.documents) {
      docs = data.documents;
    }

    proofIdDocuments.value = Array.isArray(docs) ? docs : [];
  } catch (err) {
    console.error("GET /client/documents/proof-of-id error:", err);
  }
};

const loadProofResidenceDocuments = async () => {
  try {
    const response = await apiGet("/client/documents/proof-of-residence");
    const data = await response.json().catch(() => null);

    let docs = [];
    if (data?.success && data?.data?.documents) {
      docs = data.data.documents;
    } else if (data?.data?.documents) {
      docs = data.data.documents;
    } else if (data?.documents) {
      docs = data.documents;
    }

    proofResidenceDocuments.value = Array.isArray(docs) ? docs : [];
  } catch (err) {
    console.error("GET /client/documents/proof-of-residence error:", err);
  }
};

const loadDocuments = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    await Promise.all([
      loadProofIdDocuments(),
      loadProofResidenceDocuments(),
    ]);
  } catch (err) {
    console.error("Error loading documents:", err);
    errorMessage.value = "Unable to load your documents.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDocuments();
});

// -------------------- handlers --------------------
const openModal = (category = "proof_of_id") => {
  activeCategory.value = category;
  showModal.value = true;
  successMessage.value = "";
  errorMessage.value = "";
  selectedType.value = "";
  frontFile.value = null;
  backFile.value = null;
  // Reset file input elements
  nextTick(() => {
    if (frontFileInput.value) frontFileInput.value.value = "";
    if (backFileInput.value) backFileInput.value.value = "";
  });
};

const closeModal = () => {
  showModal.value = false;
};

const selectCategory = (category) => {
  activeCategory.value = category;
  selectedType.value = "";
  frontFile.value = null;
  backFile.value = null;
  errorMessage.value = "";
  successMessage.value = "";
  // Reset file input elements
  nextTick(() => {
    if (frontFileInput.value) frontFileInput.value.value = "";
    if (backFileInput.value) backFileInput.value.value = "";
  });
  // No API call needed - we already have the data cached
};

const handleFrontChange = (e) => {
  const file = e.target.files?.[0];
  frontFile.value = file || null;
};

const handleBackChange = (e) => {
  const file = e.target.files?.[0];
  backFile.value = file || null;
};

const handleUpload = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  if (!selectedType.value) {
    errorMessage.value = "Please select a document type.";
    return;
  }

  if (!frontFile.value) {
    errorMessage.value = "Please select the front image.";
    return;
  }

  // Back image is required only for non-passport proof of ID documents
  if (isBackImageRequired.value && !backFile.value) {
    errorMessage.value = "Please select the back image.";
    return;
  }

  const formData = new FormData();
  formData.append("document_type", selectedType.value);
  formData.append("front_image", frontFile.value);
  // Only send back image if it's required and provided
  if (isBackImageRequired.value && backFile.value) {
    formData.append("back_image", backFile.value);
  }

  uploading.value = true;

  try {
    let endpoint = "";
    if (activeCategory.value === "proof_of_id") {
      endpoint = "/client/documents/proof-of-id";
    } else if (activeCategory.value === "proof_of_residence") {
      endpoint = "/client/documents/proof-of-residence";
    } else {
      throw new Error("Invalid document category");
    }

    const response = await apiPost(endpoint, formData);

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

    successMessage.value = data?.message || "Document uploaded successfully.";
    // Reload all documents once after successful upload
    await loadDocuments();
    // reset inputs
    selectedType.value = "";
    frontFile.value = null;
    backFile.value = null;
    // Close modal after a short delay to show success message
    setTimeout(() => {
      showModal.value = false;
    }, 1500);
  } catch (err) {
    console.error("POST document error:", err);
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      errorMessage.value = "Network error: Unable to connect to server. Please check your connection and try again.";
    } else if (err.message) {
      errorMessage.value = err.message;
    } else {
      errorMessage.value = "Unable to upload document. Please try again.";
    }
  } finally {
    uploading.value = false;
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
  if (s === "not_submitted") return "Not Submitted";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

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
  <div>
    <!-- Card on Profile page -->
    <div class="card shadow-sm border-0">
      <div class="card-body">
        <h5 class="mb-2">My Documents</h5>
        <p class="text-muted mb-3">
          Please upload the following missing Documents.
        </p>

        <!-- Missing Documents List -->
        <div class="p-3 rounded mb-3" style="background: #f8f9fb;">
          <!-- Proof of ID -->
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <span v-if="missingProofId" class="text-danger">
                <span class="me-2">❗</span>Proof of ID (Required)
              </span>
              <span v-else class="text-success">
                <span class="me-2">✅</span>Proof of ID
              </span>
            </div>
            <button
              class="btn btn-secondary"
              style="font-size: 12px; padding: 4px 12px;"
              disabled
            >
              {{ getStatusText(proofIdStatus).toUpperCase() }}
            </button>
          </div>

          <!-- Proof of Residence -->
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span v-if="missingProofResidence" class="text-danger">
                <span class="me-2">❗</span>Proof of Residence (Required)
              </span>
              <span v-else class="text-success">
                <span class="me-2">✅</span>Proof of Residence
              </span>
            </div>
            <button
              class="btn btn-secondary"
              style="font-size: 12px; padding: 4px 12px;"
              disabled
            >
              {{ getStatusText(proofResidenceStatus).toUpperCase() }}
            </button>
          </div>
        </div>

        <!-- Single Upload Button -->
        <div class="text-center">
          <ArgonButton
            color="success"
            variant="gradient"
            :disabled="(proofIdStatus === 'approved' && proofResidenceStatus === 'approved') || (proofIdStatus === 'pending' && proofResidenceStatus === 'pending')"
            @click="openModal(missingProofId ? 'proof_of_id' : 'proof_of_residence')"
          >
            Upload Documents
          </ArgonButton>
        </div>

        <div v-if="loading" class="text-muted mt-3" style="font-size: 13px;">
          Loading document status...
        </div>

        <div v-if="errorMessage && !showModal" class="alert alert-danger mt-3">
          {{ errorMessage }}
        </div>
      </div>
    </div>

    <!-- Custom modal with sidebar -->
    <div
      v-if="showModal"
      class="doc-modal-backdrop"
      @click.self="closeModal"
    >
      <div class="doc-modal">
        <div class="doc-modal-header">
          <h5 class="mb-0">Upload your Documents</h5>
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
                <span v-if="missingProofId" class="text-danger" style="font-size: 20px;">❗</span>
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
                <span v-if="missingProofResidence" class="text-danger" style="font-size: 20px;">❗</span>
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

              <!-- Info Banner -->
              <div
                class="mb-3 p-3 rounded"
                style="background-color: #e9ecef; color: #000000; border: 1px solid #dee2e6;"
              >
                <strong>Required:</strong> Upload your passport copy to verify your identity. In case you do not have a passport please provide a copy of your national ID card bearing your photo.
              </div>

              <!-- Document Type Selector -->
              <div class="mb-3" v-if="!isApproved && !isPending">
                <label class="form-label">Document Type</label>
                <select
                  v-model="selectedType"
                  class="form-select"
                  :disabled="uploading"
                >
                  <option value="">Select</option>
                  <option
                    v-for="opt in currentDocumentTypes"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <!-- Upload Form (only show if not approved and not pending) -->
              <template v-if="!isApproved && !isPending">
                <div class="mb-3" v-if="activeCategory === 'proof_of_id'">
                  <label class="form-label">Front Image <span class="text-danger">*</span></label>
                  <input
                    ref="frontFileInput"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    class="form-control"
                    :disabled="uploading"
                    required
                    @change="handleFrontChange"
                  />
                </div>

                <div class="mb-3" v-else-if="activeCategory === 'proof_of_residence'">
                  <div class="file-input-wrapper">
                    <input
                      ref="frontFileInput"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      class="form-control"
                      :disabled="uploading"
                      required
                      @change="handleFrontChange"
                    />
                    <small class="text-muted d-block mt-1">
                      Choose file to upload (PDF, JPG, PNG, or WEBP format)
                    </small>
                  </div>
                </div>

                <div class="mb-3" v-if="activeCategory === 'proof_of_id' && isBackImageRequired">
                  <label class="form-label">Back Image <span class="text-danger">*</span></label>
                  <input
                    ref="backFileInput"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    class="form-control"
                    :disabled="uploading"
                    required
                    @change="handleBackChange"
                  />
                  <small class="text-muted">
                    Back image is required for Driver's License and National ID.
                  </small>
                </div>


                <div class="d-flex justify-content-end mt-3">
                  <ArgonButton
                    color="success"
                    variant="gradient"
                    :disabled="uploading"
                    @click="handleUpload"
                  >
                    {{ uploading ? "Uploading..." : "Upload" }}
                  </ArgonButton>
                </div>
              </template>

              <!-- Status Messages -->
              <div v-if="isApproved" class="mb-3 p-3 rounded" style="background-color: #000000; color: #ffffff;">
                Your document has been approved. No further action is required.
              </div>

              <div v-else-if="isPending" class="mb-3 p-3 rounded" style="background-color: #000000; color: #ffffff;">
                Your document is pending review. Please wait for admin approval.
              </div>

              <div v-if="errorMessage" class="alert alert-danger mt-3">
                {{ errorMessage }}
              </div>
              <div v-if="successMessage" class="mt-3 p-3 rounded" style="background-color: #000000; color: #ffffff;">
                {{ successMessage }}
              </div>

              <!-- Uploaded Documents Table -->
              <div class="mb-3 mt-4" v-if="currentDocuments.length > 0" style="overflow-x: auto;">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Status</th>
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
                        <ArgonButton
                          color="info"
                          size="sm"
                          @click="viewDocument(doc)"
                          :disabled="!doc.front_image_url"
                        >
                          View Document
                        </ArgonButton>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
          <!-- Show both images side by side if back image exists (Proof of ID) -->
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
          <!-- Show single image if no back image (Proof of Residence) -->
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
  
  .doc-modal-main table {
    font-size: 14px;
  }
  
  .doc-modal-main .table th,
  .doc-modal-main .table td {
    padding: 8px 4px;
  }
  
  .doc-modal-main .btn-sm {
    font-size: 12px;
    padding: 4px 8px;
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
  
  /* Main card responsive */
  .card-body {
    padding: 12px !important;
  }
  
  .card-body h5 {
    font-size: 18px;
  }
  
  .card-body .p-3 {
    padding: 12px !important;
  }
  
  .card-body .btn {
    width: 100%;
    font-size: 14px;
    padding: 10px;
  }
  
  .card-body .d-flex.justify-content-between {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .card-body .btn-secondary {
    font-size: 11px;
    padding: 3px 8px;
  }
}
</style>