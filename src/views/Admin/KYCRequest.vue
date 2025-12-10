<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import UserDocumentsModal from './components/UserDocumentsModal.vue';
import { apiGet } from '@/utils/api.js';

// State
const documents = ref([]);
const loading = ref(false);
const activeTab = ref('all'); // all, approved, rejected
const showUserModal = ref(false);
const selectedUser = ref(null);
const userDocuments = ref([]);
const loadingUserDocuments = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
});

// Load documents based on filters
const loadDocuments = async (page = 1) => {
  loading.value = true;
  currentPage.value = page;

  try {
    const endpoint = '/admin/documents';
    const params = new URLSearchParams();

    // Add status filter based on active tab
    if (activeTab.value === 'approved') {
      params.append('status', 'approved');
    } else if (activeTab.value === 'rejected') {
      params.append('status', 'rejected');
    }
    // 'all' tab doesn't add status filter

    // Add pagination (fixed at 15)
    params.append('page', page);
    params.append('per_page', 15);

    const queryString = params.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    const response = await apiGet(url);
    const data = await response.json().catch(() => null);

    let documentList = [];
    let paginationData = null;

    if (data?.success && data?.data) {
      if (data.data.documents) {
        if (data.data.documents.data) {
          documentList = Array.isArray(data.data.documents.data) ? data.data.documents.data : [];
          paginationData = data.data.documents;
        } else if (Array.isArray(data.data.documents)) {
          documentList = data.data.documents;
        }
      } else if (Array.isArray(data.data)) {
        documentList = data.data;
      }
      
      // Handle pagination
      if (paginationData) {
        pagination.value = {
          current_page: paginationData.current_page || 1,
          last_page: paginationData.last_page || 1,
          per_page: paginationData.per_page || 15,
          total: paginationData.total || 0,
        };
        totalPages.value = pagination.value.last_page;
      }
    } else if (data?.data?.documents?.data) {
      documentList = Array.isArray(data.data.documents.data) ? data.data.documents.data : [];
      if (data.data.documents) {
        pagination.value = {
          current_page: data.data.documents.current_page || 1,
          last_page: data.data.documents.last_page || 1,
          per_page: data.data.documents.per_page || 15,
          total: data.data.documents.total || 0,
        };
        totalPages.value = pagination.value.last_page;
      }
    } else if (Array.isArray(data?.data)) {
      documentList = data.data;
    }

    documents.value = Array.isArray(documentList) ? documentList : [];
  } catch (err) {
    console.error('GET /admin/documents error:', err);
    documents.value = [];
  } finally {
    loading.value = false;
  }
};

// Watch for tab changes
watch(activeTab, () => {
  currentPage.value = 1;
  loadDocuments(1);
});

// Group documents by user
const documentsByUser = computed(() => {
  const grouped = {};
  documents.value.forEach(doc => {
    const userId = doc.user_id || doc.user?.id;
    if (userId) {
      if (!grouped[userId]) {
        grouped[userId] = {
          user: doc.user || { id: userId, name: 'Unknown User', email: '—', country: '—' },
          documents: []
        };
      }
      grouped[userId].documents.push(doc);
    }
  });
  return grouped;
});

// Get unique users for table display
const uniqueUsers = computed(() => {
  const userMap = new Map();
  documents.value.forEach(doc => {
    const userId = doc.user_id || doc.user?.id;
    if (userId && !userMap.has(userId)) {
      userMap.set(userId, {
        user: doc.user || { id: userId, name: 'Unknown User', email: '—', country: '—' },
        documents: documentsByUser.value[userId]?.documents || []
      });
    }
  });
  return Array.from(userMap.values());
});

// Get status badges for a user's documents
const getUserStatusBadges = (userData) => {
  const statuses = ['pending', 'approved', 'rejected'];
  return statuses.filter(status => 
    userData.documents.some(d => d.status === status)
  );
};

// Load all documents for a specific user
const loadUserDocuments = async (userId) => {
  loadingUserDocuments.value = true;
  try {
    // Get all documents for this user (no pagination)
    const response = await apiGet(`/admin/documents?user_id=${userId}&per_page=1000`);
    const data = await response.json().catch(() => null);

    let documentList = [];
    if (data?.success && data?.data) {
      if (data.data.documents?.data) {
        documentList = Array.isArray(data.data.documents.data) ? data.data.documents.data : [];
      } else if (Array.isArray(data.data.documents)) {
        documentList = data.data.documents;
      } else if (Array.isArray(data.data)) {
        documentList = data.data;
      }
    } else if (data?.data?.documents?.data) {
      documentList = Array.isArray(data.data.documents.data) ? data.data.documents.data : [];
    } else if (Array.isArray(data?.data)) {
      documentList = data.data;
    }

    userDocuments.value = Array.isArray(documentList) ? documentList : [];
  } catch (err) {
    console.error('Error loading user documents:', err);
    // Fallback to documents from current page
    userDocuments.value = documentsByUser.value[userId]?.documents || [];
  } finally {
    loadingUserDocuments.value = false;
  }
};

// Handle review user documents
const handleReviewUser = async (userData) => {
  selectedUser.value = userData.user;
  showUserModal.value = true;
  
  // Load all documents for this user
  await loadUserDocuments(userData.user.id);
};

// Handle document updated
const handleDocumentUpdated = () => {
  loadDocuments(currentPage.value);
};

// Pagination handlers
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    loadDocuments(page);
  }
};

const goToPrevious = () => {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1);
  }
};

const goToNext = () => {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1);
  }
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

// Get status color
const getStatusColor = (status) => {
  const statusLower = (status || '').toLowerCase();
  if (statusLower === 'approved') return '#28a745'; // green
  if (statusLower === 'rejected') return '#dc3545'; // red
  if (statusLower === 'pending') return '#ffc107'; // yellow
  return '#6c757d';
};

const getStatusBgColor = (status) => {
  const statusLower = (status || '').toLowerCase();
  if (statusLower === 'approved') return '#d4edda';
  if (statusLower === 'rejected') return '#f8d7da';
  if (statusLower === 'pending') return '#fff3cd';
  return '#e2e3e5';
};


onMounted(() => {
  loadDocuments();
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="mb-0 text-dark fw-bold">
            <i class="fas fa-id-card me-2"></i>
            KYC Document Requests
          </h4>
        </div>

        <!-- Tabs -->
        <div class="d-flex align-items-center gap-4 border-bottom pb-2 mb-4" style="border-bottom: 1px solid #e9ecef !important;">
          <button
            v-for="tab in [
              { id: 'all', label: 'All' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'approved', label: 'Approved' },
            ]"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="btn btn-link p-0 text-decoration-none border-0 position-relative"
            :class="{
              'text-dark fw-bold': activeTab === tab.id,
              'text-muted': activeTab !== tab.id,
            }"
            style="background: none; border: none;"
          >
            {{ tab.label }}
            <div
              v-if="activeTab === tab.id"
              class="position-absolute start-0"
              style="bottom: -10px; width: 100%; height: 2px; background-color: #344767;"
            ></div>
          </button>
        </div>

        <!-- Table -->
        <div v-if="loading" class="text-center text-muted py-5">
          <i class="fas fa-spinner fa-spin me-2"></i>
          Loading documents...
        </div>

        <div v-else-if="documents.length === 0" class="text-center text-muted py-5">
          <i class="fas fa-folder-open fa-2x mb-3 opacity-50"></i>
          <p class="mb-0">No documents found.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table align-items-center mb-0" style="background-color: white;">
            <thead>
              <tr>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  style="padding: 0.75rem;"
                >
                  User Info
                </th>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  style="padding: 0.75rem;"
                >
                  Documents Count
                </th>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  style="padding: 0.75rem;"
                >
                  Status Summary
                </th>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  style="padding: 0.75rem;"
                >
                  Last Submitted
                </th>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 text-end"
                  style="padding: 0.75rem;"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="userData in uniqueUsers" :key="userData.user.id">
                <td style="padding: 0.75rem;">
                  <div class="d-flex flex-column">
                    <span class="text-sm text-dark fw-bold mb-1">{{ userData.user?.name || '—' }}</span>
                    <span class="text-xs text-muted mb-1">{{ userData.user?.email || '—' }}</span>
                    <span class="text-xs text-muted">{{ userData.user?.country || '—' }}</span>
                  </div>
                </td>
                <td class="text-sm text-dark" style="padding: 0.75rem;">
                  {{ userData.documents.length }} document(s)
                </td>
                <td style="padding: 0.75rem;">
                  <div class="d-flex flex-wrap gap-1">
                    <span
                      v-for="status in getUserStatusBadges(userData)"
                      :key="status"
                      class="badge badge-sm"
                      :style="{
                        backgroundColor: getStatusBgColor(status),
                        color: getStatusColor(status),
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '0.65rem',
                      }"
                    >
                      {{ status.toUpperCase() }}: {{ userData.documents.filter(d => d.status === status).length }}
                    </span>
                  </div>
                </td>
                <td class="text-sm text-dark" style="padding: 0.75rem;">
                  {{ formatDate(userData.documents[0]?.created_at) }}
                </td>
                <td class="text-end" style="padding: 0.75rem;">
                  <ArgonButton
                    color="dark"
                    variant="gradient"
                    size="sm"
                    @click="handleReviewUser(userData)"
                  >
                    <i class="fas fa-eye me-1"></i>
                    View All
                  </ArgonButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="!loading && documents.length > 0"
          class="d-flex justify-content-between align-items-center mt-4"
        >
          <div class="text-sm text-muted">
            Showing {{ ((currentPage - 1) * 15) + 1 }} to 
            {{ Math.min(currentPage * 15, pagination.total) }} of 
            {{ pagination.total }} documents
          </div>
          <div class="d-flex justify-content-end align-items-center gap-2">
            <button
              class="btn btn-sm"
              :class="currentPage === 1 ? 'btn-secondary' : 'btn-outline-success'"
              :disabled="currentPage === 1"
              @click="goToPrevious"
              style="min-width: 80px;"
            >
              Previous
            </button>
            <button
              v-if="totalPages > 0"
              class="btn btn-sm bg-gradient-success text-white"
              style="min-width: 40px;"
            >
              {{ currentPage }}
            </button>
            <button
              class="btn btn-sm"
              :class="currentPage >= totalPages ? 'btn-secondary' : 'btn-outline-success'"
              :disabled="currentPage >= totalPages"
              @click="goToNext"
              style="min-width: 80px;"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- User Documents Modal -->
    <UserDocumentsModal
      v-model:show="showUserModal"
      :user="selectedUser"
      :documents="userDocuments"
      :loading="loadingUserDocuments"
      @document-updated="handleDocumentUpdated"
    />
  </div>
</template>

<style scoped>
.text-xxs {
  font-size: 0.75rem;
}

.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.875rem;
}

.card {
  background-color: white;
  border-radius: 0.5rem;
}

.table {
  margin-bottom: 0;
}

.table thead th {
  border-bottom: 1px solid #e9ecef;
  background-color: white;
}

.table tbody tr {
  border-bottom: 1px solid #f0f0f0;
}

.table tbody tr:last-child {
  border-bottom: none;
}

.table tbody tr:hover {
  background-color: #f8f9fa;
}

.badge-sm {
  font-size: 0.7rem;
  font-weight: 600;
}

.btn-link {
  transition: color 0.2s ease;
}

.btn-link:hover {
  color: #344767 !important;
}
</style>
