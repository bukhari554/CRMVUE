<script setup>
import { ref, computed, onMounted } from "vue";
import { apiGet } from "@/utils/api.js";
import LoadingSpinner from "@/components/LoadingSpinner.vue";

// -------------------- state --------------------
const proofIdDocuments = ref([]);
const proofResidenceDocuments = ref([]);
const loading = ref(false);

// -------------------- computed --------------------
const missingProofId = computed(() => proofIdDocuments.value.length === 0);
const missingProofResidence = computed(() => proofResidenceDocuments.value.length === 0);

const proofIdStatus = computed(() => {
  if (proofIdDocuments.value.length === 0) return "not_submitted";
  return proofIdDocuments.value[0]?.status || "pending";
});

const proofResidenceStatus = computed(() => {
  if (proofResidenceDocuments.value.length === 0) return "not_submitted";
  return proofResidenceDocuments.value[0]?.status || "pending";
});

// -------------------- api --------------------
const loadProofIdDocuments = async () => {
  try {
    let res = await apiGet("/client/documents?category=proof_of_id");
    if (!res.ok && (res.status === 404 || res.status === 405)) {
      res = await apiGet("/client/documents/proof-of-id");
    }
    const data = await res.json().catch(() => null);
    const docs = Array.isArray(data?.data?.documents)
      ? data.data.documents
      : (Array.isArray(data?.data?.documents?.data) ? data.data.documents.data : []);
    proofIdDocuments.value = docs.map((d) => {
      if (!d) return d;
      return (String(d.document_type || '').toLowerCase() === 'cnic')
        ? { ...d, document_type: 'national_id' }
        : d;
    });
  } catch (e) {
    console.error(e);
  }
};

const loadProofResidenceDocuments = async () => {
  try {
    let res = await apiGet("/client/documents?category=proof_of_residence");
    if (!res.ok && (res.status === 404 || res.status === 405)) {
      res = await apiGet("/client/documents/proof-of-residence");
    }
    const data = await res.json().catch(() => null);
    proofResidenceDocuments.value = Array.isArray(data?.data?.documents)
      ? data.data.documents
      : (Array.isArray(data?.data?.documents?.data) ? data.data.documents.data : []);
  } catch (e) {
    console.error(e);
  }
};

const loadDocuments = async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadProofIdDocuments(),
      loadProofResidenceDocuments()
    ]);
  } finally {
    loading.value = false;
  }
};

onMounted(loadDocuments);

// -------------------- helpers --------------------
const getStatusText = (status) => {
  const s = (status || "pending").toLowerCase();
  if (s === "not_submitted") return "Not Submitted";
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Rejected";
  if (s === "pending") return "Pending";
  return s;
};

const getStatusClass = (status) => {
  const s = (status || "pending").toLowerCase();
  if (s === "approved") return "text-success";
  if (s === "rejected") return "text-danger";
  if (s === "pending") return "text-warning";
  if (s === "not_submitted") return "text-muted";
  return "text-secondary";
};
</script>

<template>
  <div class="document-status-wrapper">
    <div class="card shadow-sm border-0">
      <div class="card-body">
        <h5 class="mb-2">My Documents</h5>
        <p class="text-muted mb-3">Document verification status</p>

        <!-- Content Container -->
        <div class="content-container">
          <!-- Loading -->
          <div v-if="loading" class="loading-wrapper">
            <LoadingSpinner text="Loading document status..." />
          </div>

          <!-- Content -->
          <div v-else class="document-content p-3 rounded" style="background:#f8f9fb;">
            <!-- Proof of ID -->
            <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
              <div>
                <span v-if="missingProofId" class="text-danger">
                  <i class="fas fa-exclamation-circle me-2"></i>Proof of ID
                </span>
                <span v-else :class="getStatusClass(proofIdStatus)">
                  <i class="fas fa-check-circle me-2"></i>Proof of ID
                </span>
              </div>
              <span
                class="badge"
                :class="{
                  'bg-success': proofIdStatus === 'approved',
                  'bg-danger': proofIdStatus === 'rejected',
                  'bg-warning text-dark': proofIdStatus === 'pending',
                  'bg-secondary': proofIdStatus === 'not_submitted'
                }"
              >
                {{ getStatusText(proofIdStatus).toUpperCase() }}
              </span>
            </div>

            <!-- Proof of Residence -->
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span v-if="missingProofResidence" class="text-danger">
                  <i class="fas fa-exclamation-circle me-2"></i>Proof of Residence
                </span>
                <span v-else :class="getStatusClass(proofResidenceStatus)">
                  <i class="fas fa-check-circle me-2"></i>Proof of Residence
                </span>
              </div>
              <span
                class="badge"
                :class="{
                  'bg-success': proofResidenceStatus === 'approved',
                  'bg-danger': proofResidenceStatus === 'rejected',
                  'bg-warning text-dark': proofResidenceStatus === 'pending',
                  'bg-secondary': proofResidenceStatus === 'not_submitted'
                }"
              >
                {{ getStatusText(proofResidenceStatus).toUpperCase() }}
              </span>
            </div>
          </div>
        </div>

        <!-- Refresh Button -->
        <div class="mt-4 text-center">
          <button
            class="btn btn-sm"
            style="
              background-color:#111111;
              color:#ffffff;
              border-radius:8px;
              font-weight:600;
              padding:6px 18px;
              min-width:130px;
            "
            @click="loadDocuments"
            :disabled="loading"
          >
            <i class="fas fa-sync-alt me-2"></i>
            Refresh
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component wrapper - adopts parent size */
.document-status-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card {
  border-radius: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.card-body {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Content container - flexible */
.content-container {
  min-height: 110px;
  position: relative;
  flex: 1;
}

/* Loading wrapper - centered */
.loading-wrapper {
  min-height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* Document content */
.document-content {
  min-height: 110px;
}

.badge {
  font-size: 11px;
  padding: 6px 12px;
  font-weight: 600;
  border-radius: 20px;
}

@media (max-width: 768px) {
  .card-body {
    padding: 16px;
  }

  .badge {
    font-size: 10px;
    padding: 4px 8px;
  }
  
  .content-container {
    min-height: 100px;
  }
  
  .loading-wrapper {
    min-height: 100px;
  }
  
  .document-content {
    min-height: 100px;
  }
}
</style>