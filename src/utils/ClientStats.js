// composables/useClientStats.js
import { ref } from 'vue';
import { apiGet } from '@/utils/api.js';

const loading = ref(false);
const totalClients = ref(0);
const activeClients = ref(0);
const error = ref(null);

const isFetched = ref({
  totalClients: false,
  activeClients: false,
});

export function useClientStats() {
  
  // Total clients count
  const fetchTotalClients = async (force = false) => {
    if (isFetched.value.totalClients && !force) {
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        per_page: '1',
      });

      const response = await apiGet(`/admin/clients?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.clients) {
          totalClients.value = data.data.clients.total || 0;
          isFetched.value.totalClients = true;
        }
      } else {
        error.value = 'Failed to fetch total clients';
      }
    } catch (err) {
      console.error('Error fetching total clients:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Active clients count (all registered clients - using total from API)
  const fetchActiveClients = async (force = false) => {
    if (isFetched.value.activeClients && !force) {
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      // Use the total count from API response (same as fetchTotalClients)
      const params = new URLSearchParams({
        per_page: '1', // Just need the total count
      });

      const response = await apiGet(`/admin/clients?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.clients) {
          // Use total count from pagination - this represents all active clients
          activeClients.value = data.data.clients.total || 0;
          isFetched.value.activeClients = true;
        }
      } else {
        error.value = 'Failed to fetch active clients';
      }
    } catch (err) {
      console.error('Error fetching active clients:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    totalClients,
    activeClients,
    error,
    fetchTotalClients,
    fetchActiveClients,
  };
}

