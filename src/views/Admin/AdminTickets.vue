<script setup>
import { ref, onMounted, watch } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import TicketRow from './components/TicketRow.vue';
import TicketTabs from './components/TicketTabs.vue';
import TicketConversationModal from './components/TicketConversationModal.vue';
import TicketCategoryModal from './components/TicketCategoryModal.vue';
import { apiGet } from '@/utils/api.js';

// State
const tickets = ref([]);
const loading = ref(false);
const activeTab = ref('open'); // open, closed, all
const unreadFilter = ref(false);
const showConversationModal = ref(false);
const showCategoryModal = ref(false);
const selectedTicketId = ref(null);
const currentPage = ref(1);
const totalPages = ref(1);
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
});

// Load tickets based on filters
const loadTickets = async (page = 1) => {
  loading.value = true;
  currentPage.value = page;

  try {
    const endpoint = '/admin/tickets';
    const params = new URLSearchParams();

    // Add status filter based on active tab
    if (activeTab.value === 'open') {
      params.append('status', 'open');
    } else if (activeTab.value === 'closed') {
      params.append('status', 'closed');
    }
    // 'all' tab doesn't add status filter

    // Add unread filter
    if (unreadFilter.value) {
      params.append('is_read', 'false');
    }

    // Add pagination
    params.append('page', page);
    params.append('per_page', 15);

    const queryString = params.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    const response = await apiGet(url);
    const data = await response.json().catch(() => null);

    let ticketList = [];
    let paginationData = null;

    if (data?.success && data?.data) {
      // Handle response structure: { success: true, data: { tickets: [], pagination: {} } }
      if (data.data.tickets) {
        ticketList = Array.isArray(data.data.tickets) ? data.data.tickets : [];
        paginationData = data.data.pagination;
      } else if (Array.isArray(data.data)) {
        ticketList = data.data;
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
      } else if (data.data.current_page !== undefined) {
        // Fallback: pagination at data.data level
        pagination.value = {
          current_page: data.data.current_page || 1,
          last_page: data.data.last_page || 1,
          per_page: data.data.per_page || 15,
          total: data.data.total || 0,
        };
        totalPages.value = pagination.value.last_page;
      }
    } else if (data?.data?.tickets) {
      ticketList = Array.isArray(data.data.tickets) ? data.data.tickets : [];
      if (data.data.pagination) {
        pagination.value = {
          current_page: data.data.pagination.current_page || 1,
          last_page: data.data.pagination.last_page || 1,
          per_page: data.data.pagination.per_page || 15,
          total: data.data.pagination.total || 0,
        };
        totalPages.value = pagination.value.last_page;
      }
    } else if (data?.tickets) {
      ticketList = data.tickets;
    } else if (Array.isArray(data?.data)) {
      ticketList = data.data;
    }

    tickets.value = Array.isArray(ticketList) ? ticketList : [];
  } catch (err) {
    console.error('GET /admin/tickets error:', err);
    tickets.value = [];
  } finally {
    loading.value = false;
  }
};

// Watch for tab changes
watch(activeTab, () => {
  currentPage.value = 1;
  loadTickets(1);
});

// Watch for filter changes
watch([unreadFilter], () => {
  currentPage.value = 1;
  loadTickets(1);
});

// Handle view ticket
const handleViewTicket = (ticket) => {
  selectedTicketId.value = ticket.id;
  showConversationModal.value = true;
};

// Handle ticket updated
const handleTicketUpdated = () => {
  loadTickets(currentPage.value);
};

// Pagination handlers
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    loadTickets(page);
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

// Handle category updated
const handleCategoryUpdated = () => {
  // Categories updated, no need to reload tickets
};

onMounted(() => {
  loadTickets();
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="mb-0 text-dark fw-bold">
            <i class="fas fa-ticket-alt me-2"></i>
            Ticket Management
          </h4>
          <ArgonButton
            color="success"
            variant="gradient"
            @click="showCategoryModal = true"
          >
            <i class="fas fa-plus me-1"></i>
            Add Ticket Category
          </ArgonButton>
        </div>

        <!-- Tabs -->
        <div class="mb-4">
          <TicketTabs v-model:activeTab="activeTab" />
        </div>

        <!-- Filters -->
        <div class="row mb-4">
          <div class="col-md-3 mb-3 mb-md-0">
            <label class="form-label text-sm text-secondary mb-1">Unread</label>
            <div class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                id="unreadFilter"
                v-model="unreadFilter"
              />
              <label class="form-check-label text-sm" for="unreadFilter">
                Show Unread Only
              </label>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div v-if="loading" class="text-center text-muted py-5">
          <i class="fas fa-spinner fa-spin me-2"></i>
          Loading tickets...
        </div>

        <div v-else-if="tickets.length === 0" class="text-center text-muted py-5">
          <i class="fas fa-inbox fa-2x mb-3 opacity-50"></i>
          <p class="mb-0">No tickets found.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table align-items-center mb-0" style="background-color: white;">
            <thead>
              <tr>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  style="padding: 0.75rem;"
                >
                  Ticket ID
                </th>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  style="padding: 0.75rem;"
                >
                  Name
                </th>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  style="padding: 0.75rem;"
                >
                  Subject
                </th>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  style="padding: 0.75rem;"
                >
                  Status
                </th>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  style="padding: 0.75rem;"
                >
                  Created Date
                </th>
                <th
                  class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  style="padding: 0.75rem;"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              <TicketRow
                v-for="ticket in tickets"
                :key="ticket.id"
                :ticket="ticket"
                @view="handleViewTicket"
                @status-updated="handleTicketUpdated"
              />
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="!loading && tickets.length > 0"
          class="d-flex justify-content-between align-items-center mt-4"
        >
          <div class="text-sm text-muted">
            Showing {{ ((currentPage - 1) * 15) + 1 }} to 
            {{ Math.min(currentPage * 15, pagination.total) }} of 
            {{ pagination.total }} tickets
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

    <!-- Conversation Modal -->
    <TicketConversationModal
      v-model:show="showConversationModal"
      :ticket-id="selectedTicketId"
      @ticket-updated="handleTicketUpdated"
    />

    <!-- Category Modal -->
    <TicketCategoryModal
      v-model:show="showCategoryModal"
      @category-updated="handleCategoryUpdated"
    />
  </div>
</template>

<style scoped>
.text-xxs {
  font-size: 0.75rem;
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
</style>
