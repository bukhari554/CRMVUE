<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import ArgonButton from "@/components/ArgonButton.vue";
import { apiGet, apiPost } from "@/utils/api.js";

// -------------------- state --------------------
const documents = ref([]);
const loading = ref(false);
const uploading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const showModal = ref(false);

// upload form
const selectedType = ref("");
const frontFile = ref(null);
const backFile = ref(null);
const frontFileInput = ref(null);
const backFileInput = ref(null);

// -------------------- config --------------------
// Document types matching backend constants
const documentTypes = [
  { value: "driver_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID" },
];

// -------------------- computed --------------------
const proofIdUploaded = computed(() =>
  documents.value.filter((d) =>
    ["driver_license", "passport", "national_id"].includes(d.document_type)
  )
);

const missingProofId = computed(() => proofIdUploaded.value.length === 0);

// Get the first uploaded document (if any)
const currentDocument = computed(() => proofIdUploaded.value[0] || null);

// Get KYC status - show "not_submitted" if no document, otherwise show the status
const kycStatus = computed(() => {
  if (!currentDocument.value) return "not_submitted";
  return currentDocument.value.status || "pending";
});

// Check if document is approved
const isApproved = computed(() => kycStatus.value === "approved");

// Check if status is pending
const isPending = computed(() => kycStatus.value === "pending");

// Status badge color - using Bootstrap badge classes
const statusBadgeClass = computed(() => {
  const status = kycStatus.value.toLowerCase();
  if (status === "approved") return "badge bg-success";
  if (status === "rejected") return "badge bg-danger";
  if (status === "pending") return "badge bg-warning";
  return "badge bg-secondary"; // not_submitted
});

// Status display text
const statusDisplayText = computed(() => {
  const status = kycStatus.value.toLowerCase();
  if (status === "not_submitted") return "Not Submitted";
  return status.charAt(0).toUpperCase() + status.slice(1);
});

// Check if upload should be disabled
const isUploadDisabled = computed(() => isApproved.value || isPending.value);

// -------------------- api --------------------
const loadDocuments = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await apiGet("/client/documents");
    const data = await response.json().catch(() => null);

    let docs = [];
    // Parse response based on structure: { success: true, data: { documents: [...] } }
    if (data?.success && data?.data?.documents) {
      docs = data.data.documents;
    } else if (data?.data?.documents) {
      docs = data.data.documents;
    } else if (data?.documents) {
      docs = data.documents;
    }

    documents.value = Array.isArray(docs) ? docs : [];
  } catch (err) {
    console.error("GET /client/documents error:", err);
    errorMessage.value = "Unable to load your documents.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDocuments();
});

// -------------------- handlers --------------------
const openModal = () => {
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

  if (!backFile.value) {
    errorMessage.value = "Please select the back image.";
    return;
  }

  const formData = new FormData();
  formData.append("document_type", selectedType.value);
  formData.append("front_image", frontFile.value);
  formData.append("back_image", backFile.value);

  uploading.value = true;

  try {
    // Use apiPost - it will handle FormData correctly
    const response = await apiPost("/client/documents", formData);
    
    // Check if response exists (network error would throw before this)
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
    // refresh list
    await loadDocuments();
    // reset inputs and close modal after successful upload
    selectedType.value = "";
    frontFile.value = null;
    backFile.value = null;
    // Close modal after a short delay to show success message
    setTimeout(() => {
      showModal.value = false;
    }, 1500);
  } catch (err) {
    console.error("POST /client/documents error:", err);
    // Handle different error types
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

        <div class="p-3 rounded" style="background: #f8f9fb;">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span v-if="missingProofId" class="text-danger">
                <span class="me-2">❗</span>Proof of ID (Required)
              </span>
              <span v-else class="text-success">
                <span class="me-2">✅</span>Proof of ID
              </span>
            </div>
            <span :class="statusBadgeClass">
              {{ statusDisplayText }}
            </span>
          </div>

          <ArgonButton
            color="success"
            variant="gradient"
            :disabled="isUploadDisabled"
            @click="openModal"
          >
            <span v-if="isApproved">Document Approved</span>
            <span v-else-if="isPending">Pending Review</span>
            <span v-else>Upload Documents</span>
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

    <!-- Custom modal -->
    <div
      v-if="showModal"
      class="doc-modal-backdrop"
    >
      <div class="doc-modal">
        <div class="doc-modal-header">
          <h5 class="mb-0">Proof of ID</h5>
          <button
            type="button"
            class="btn btn-sm btn-light"
            @click="closeModal"
          >
            ✕
          </button>
        </div>

        <div class="doc-modal-body p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-2">
              <span :class="statusBadgeClass">
                {{ statusDisplayText }}
              </span>
            </div>
          </div>

          <div v-if="isApproved" class="alert alert-success mb-3">
            Your document has been approved. No further action is required.
          </div>

          <div v-else-if="isPending" class="alert alert-warning mb-3">
            Your document is pending review. Please wait for admin approval.
          </div>

          <div v-else class="alert alert-warning small mb-3">
            Upload your passport, driver's license, or national ID to verify your identity. Both front and back images are required.
          </div>

          <template v-if="!isApproved && !isPending">
            <div class="mb-3">
              <label class="form-label">Document Type</label>
              <select
                v-model="selectedType"
                class="form-select"
                :disabled="uploading"
              >
                <option value="">Select</option>
                <option
                  v-for="opt in documentTypes"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Front Image</label>
              <input
                ref="frontFileInput"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                class="form-control"
                :disabled="uploading"
                @change="handleFrontChange"
              />
            </div>

            <div class="mb-3">
              <label class="form-label">Back Image</label>
              <input
                ref="backFileInput"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                class="form-control"
                :disabled="uploading"
                @change="handleBackChange"
              />
              <small class="text-muted">
                Back image is required for all document types.
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

          <div v-if="isPending" class="text-center mt-3">
            <p class="text-muted mb-0">Your document is under review. You cannot upload a new document until the current one is processed.</p>
          </div>

          <div v-if="errorMessage" class="alert alert-danger mt-3">
            {{ errorMessage }}
          </div>
          <div v-if="successMessage" class="alert alert-success mt-3">
            {{ successMessage }}
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
}

.doc-modal {
  background: #ffffff;
  border-radius: 10px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.doc-modal-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.doc-modal-body {
  background: #ffffff;
}
</style>
