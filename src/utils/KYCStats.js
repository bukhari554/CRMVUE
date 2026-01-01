// composables/useKycStats.js
import { ref } from 'vue';
import { apiGet } from '@/utils/api.js';

export function useKycStats() {
  const loading = ref(false);
  const pendingKycRequests = ref(0);
  const totalKycRequests = ref(0);
  const approvedKycRequests = ref(0);
  const rejectedKycRequests = ref(0);
  const error = ref(null);

  // Pending KYC requests count
  const fetchPendingKyc = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'pending',
        per_page: '1', // Sirf count chahiye
      });

      const response = await apiGet(`/admin/documents?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data?.success && data?.data) {
          // Response structure ke mutabiq extract karo
          if (data.data.documents?.total) {
            pendingKycRequests.value = data.data.documents.total;
          } else if (data.data.documents) {
            // Agar array hai to length lo
            pendingKycRequests.value = Array.isArray(data.data.documents) 
              ? data.data.documents.length 
              : 0;
          } else if (data.data.total) {
            pendingKycRequests.value = data.data.total;
          }
        }
      } else {
        error.value = 'Failed to fetch pending KYC requests';
      }
    } catch (err) {
      console.error('Error fetching pending KYC:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Total KYC requests count (all statuses)
  const fetchTotalKyc = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        per_page: '1',
      });

      const response = await apiGet(`/admin/documents?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data?.success && data?.data) {
          if (data.data.documents?.total) {
            totalKycRequests.value = data.data.documents.total;
          } else if (data.data.total) {
            totalKycRequests.value = data.data.total;
          }
        }
      } else {
        error.value = 'Failed to fetch total KYC requests';
      }
    } catch (err) {
      console.error('Error fetching total KYC:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Approved KYC requests count
  const fetchApprovedKyc = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'approved',
        per_page: '1',
      });

      const response = await apiGet(`/admin/documents?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data?.success && data?.data) {
          if (data.data.documents?.total) {
            approvedKycRequests.value = data.data.documents.total;
          } else if (data.data.total) {
            approvedKycRequests.value = data.data.total;
          }
        }
      } else {
        error.value = 'Failed to fetch approved KYC requests';
      }
    } catch (err) {
      console.error('Error fetching approved KYC:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Rejected KYC requests count
  const fetchRejectedKyc = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'rejected',
        per_page: '1',
      });

      const response = await apiGet(`/admin/documents?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data?.success && data?.data) {
          if (data.data.documents?.total) {
            rejectedKycRequests.value = data.data.documents.total;
          } else if (data.data.total) {
            rejectedKycRequests.value = data.data.total;
          }
        }
      } else {
        error.value = 'Failed to fetch rejected KYC requests';
      }
    } catch (err) {
      console.error('Error fetching rejected KYC:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    pendingKycRequests,
    totalKycRequests,
    approvedKycRequests,
    rejectedKycRequests,
    error,
    fetchPendingKyc,
    fetchTotalKyc,
    fetchApprovedKyc,
    fetchRejectedKyc
  };
}