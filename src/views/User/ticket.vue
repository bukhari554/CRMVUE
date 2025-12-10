<script setup>
import { ref, onMounted, watch } from 'vue';
import ArgonButton from '@/components/ArgonButton.vue';
import TicketTabs from './components/TicketTabs.vue';
import TicketRow from './components/TicketRow.vue';
import AddTicketModal from './components/AddTicketModal.vue';
import EditTicketModal from './components/EditTicketModal.vue';
import { apiGet } from '@/utils/api.js';

// State
const tickets = ref([]);
const loading = ref(false);
const activeTab = ref('open');
const searchQuery = ref('');
const showAddModal = ref(false);
const showEditModal = ref(false);
const selectedTicketId = ref(null);
const currentPage = ref(1);
const totalPages = ref(1);
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
});

// Load tickets based on active tab
const loadTickets = async (page = 1) => {
  loading.value = true;
  currentPage.value = page;

  try {
    let endpoint = '/client/tickets';
    const params = new URLSearchParams();

    // Handle favourites endpoint separately
    if (activeTab.value === 'favourites') {
      endpoint = '/client/tickets/favorites';
      // For favourites, add pagination if needed
      if (page > 1) {
        params.append('page', page);
      }
      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const response = await apiGet(url);
      const data = await response.json().catch(() => null);

      let ticketList = [];
      let paginationData = null;

      if (data?.success && data?.data) {
        // Handle favourites response: { success: true, data: { tickets: [], pagination: {} } }
        if (data.data.tickets) {
          ticketList = Array.isArray(data.data.tickets) ? data.data.tickets : [];
          paginationData = data.data.pagination;
        } else if (Array.isArray(data.data)) {
          ticketList = data.data;
        }
        
        if (paginationData) {
          pagination.value = {
            current_page: paginationData.current_page || 1,
            last_page: paginationData.last_page || 1,
            per_page: paginationData.per_page || 15,
            total: paginationData.total || 0,
          };
          totalPages.value = pagination.value.last_page;
        } else {
          totalPages.value = 1;
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
        } else {
          totalPages.value = 1;
        }
      }

      tickets.value = ticketList;
      loading.value = false;
      return;
    }

    // Add status filter based on active tab
    if (activeTab.value === 'open') {
      params.append('status', 'open');
    } else if (activeTab.value === 'closed') {
      params.append('status', 'closed');
    }

    // Add pagination
    params.append('page', page);

    // Add search query if exists
    if (searchQuery.value) {
      params.append('search', searchQuery.value);
    }

    const queryString = params.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    const response = await apiGet(url);
    const data = await response.json().catch(() => null);

    let ticketList = [];
    let paginationData = null;

    if (data?.success && data?.data) {
      // Handle response structure: { success: true, data: { tickets: [], pagination: {} } }
      if (data.data.tickets) {
        ticketList = data.data.tickets;
        paginationData = data.data.pagination;
      } else if (Array.isArray(data.data)) {
        ticketList = data.data;
      }
      
      // Handle pagination from data.data.pagination
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
      ticketList = data.data.tickets;
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
    console.error('GET /client/tickets error:', err);
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

// Watch for search changes (with debounce)
let searchTimeout;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadTickets(1);
  }, 500);
});

// Handle favorite toggle
const handleToggleFavorite = async (ticketId) => {
  // Optimistically update UI
  const ticket = tickets.value.find((t) => t.id === ticketId);
  if (ticket) {
    ticket.is_favorite = !ticket.is_favorite;
  }

  // Reload to ensure sync
  await loadTickets(currentPage.value);
};

// Handle ticket creation
const handleTicketCreated = () => {
  loadTickets(currentPage.value);
};

// Handle edit
const handleEdit = (ticket) => {
  selectedTicketId.value = ticket.id;
  showEditModal.value = true;
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

onMounted(() => {
  loadTickets();
});
</script>

<template>
  <main class="container-fluid py-4">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <!-- Header: Add Ticket Button and Support Title -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="mb-0 text-dark fw-bold">Support</h4>
          <ArgonButton
            color="success"
            variant="gradient"
            @click="showAddModal = true"
          >
            <i class="fas fa-plus me-1"></i>
            Add Ticket
          </ArgonButton>
        </div>
        
        <!-- Tabs -->
        <div class="mb-4">
          <TicketTabs v-model:activeTab="activeTab" />
        </div>

            <!-- Table -->
            <div v-if="loading" class="text-center text-muted py-5">
              <i class="fas fa-spinner fa-spin me-2"></i>
              Loading tickets...
            </div>

            <div v-else-if="tickets.length === 0" class="text-center text-muted py-5">
              No tickets found.
            </div>

            <div v-else class="table-responsive">
              <table class="table align-items-center mb-0" style="background-color: white;">
                <thead>
                  <tr>
                    <th
                      class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                      style="padding: 0.75rem;"
                    >
                      <div class="d-flex align-items-center gap-1">
                        No
                        <i class="fas fa-sort text-secondary" style="font-size: 10px;"></i>
                      </div>
                    </th>
                    <th
                      class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                      style="padding: 0.75rem;"
                    >
                      <div class="d-flex align-items-center gap-1">
                        Status
                        <i class="fas fa-sort text-secondary" style="font-size: 10px;"></i>
                      </div>
                    </th>
                    <th
                      class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                      style="padding: 0.75rem;"
                    >
                      <div class="d-flex align-items-center gap-1">
                        Category
                        <i class="fas fa-sort text-secondary" style="font-size: 10px;"></i>
                      </div>
                    </th>
                    <th
                      class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                      style="padding: 0.75rem;"
                    >
                      <div class="d-flex align-items-center gap-1">
                        Start
                        <i class="fas fa-sort text-secondary" style="font-size: 10px;"></i>
                      </div>
                    </th>
                    <th
                      class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                      style="padding: 0.75rem;"
                    >
                      <div class="d-flex align-items-center gap-1">
                        Subject
                        <i class="fas fa-sort text-secondary" style="font-size: 10px;"></i>
                      </div>
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
                    @toggle-favorite="handleToggleFavorite"
                    @edit="handleEdit"
                  />
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div
              v-if="!loading && tickets.length > 0"
              class="d-flex justify-content-end align-items-center gap-2 mt-4"
            >
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
  </main>

  <!-- Add Ticket Modal -->
  <AddTicketModal
    v-model:show="showAddModal"
    @ticket-created="handleTicketCreated"
  />

  <!-- Edit Ticket Modal -->
  <EditTicketModal
    v-model:show="showEditModal"
    :ticket-id="selectedTicketId"
    @ticket-updated="handleTicketUpdated"
  />
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

.badge-sm {
  font-size: 0.7rem;
  font-weight: 600;
}
</style>
