// composables/useTicketStats.js
import { ref } from 'vue';
import { apiGet } from '@/utils/api.js';

const loading = ref(false);
const openTickets = ref(0);
const closedTickets = ref(0);
const totalTickets = ref(0);
const error = ref(null);

const isFetched = ref({
  openTickets: false,
  closedTickets: false,
  totalTickets: false,
});

export function useTicketStats() {
  
  // Open tickets count
  const fetchOpenTickets = async (force = false) => {
    if (isFetched.value.openTickets && !force) {
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'open',
        per_page: '1',
      });

      const response = await apiGet(`/admin/tickets?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data) {
          // Prioritize pagination total (most accurate)
          if (data.data.pagination?.total !== undefined) {
            openTickets.value = data.data.pagination.total;
          } else if (data.data.total !== undefined) {
            openTickets.value = data.data.total;
          } else if (data.data.tickets) {
            // If tickets array, get length
            if (Array.isArray(data.data.tickets)) {
              openTickets.value = data.data.tickets.length;
            }
          } else if (Array.isArray(data.data)) {
            openTickets.value = data.data.length;
          }
          isFetched.value.openTickets = true;
        }
      } else {
        error.value = 'Failed to fetch open tickets';
      }
    } catch (err) {
      console.error('Error fetching open tickets:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Closed tickets count
  const fetchClosedTickets = async (force = false) => {
    if (isFetched.value.closedTickets && !force) {
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'closed',
        per_page: '1',
      });

      const response = await apiGet(`/admin/tickets?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data) {
          if (data.data.tickets) {
            if (Array.isArray(data.data.tickets)) {
              closedTickets.value = data.data.tickets.length;
            } else if (data.data.pagination?.total) {
              closedTickets.value = data.data.pagination.total;
            }
          } else if (data.data.pagination?.total) {
            closedTickets.value = data.data.pagination.total;
          } else if (Array.isArray(data.data)) {
            closedTickets.value = data.data.length;
          }
          isFetched.value.closedTickets = true;
        }
      } else {
        error.value = 'Failed to fetch closed tickets';
      }
    } catch (err) {
      console.error('Error fetching closed tickets:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Total tickets count
  const fetchTotalTickets = async (force = false) => {
    if (isFetched.value.totalTickets && !force) {
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        per_page: '1',
      });

      const response = await apiGet(`/admin/tickets?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data) {
          if (data.data.pagination?.total) {
            totalTickets.value = data.data.pagination.total;
          } else if (Array.isArray(data.data)) {
            totalTickets.value = data.data.length;
          } else if (data.data.tickets && Array.isArray(data.data.tickets)) {
            totalTickets.value = data.data.tickets.length;
          }
          isFetched.value.totalTickets = true;
        }
      } else {
        error.value = 'Failed to fetch total tickets';
      }
    } catch (err) {
      console.error('Error fetching total tickets:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    openTickets,
    closedTickets,
    totalTickets,
    error,
    fetchOpenTickets,
    fetchClosedTickets,
    fetchTotalTickets,
  };
}

