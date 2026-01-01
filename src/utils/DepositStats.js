// composables/useDepositStats.js
import { ref } from 'vue';
import { apiGet } from '@/utils/api.js';

// ✅ SHARED STATE - Outside function (singleton pattern)
const loading = ref(false);
const totalDeposits = ref(0);
const completedDeposits = ref(0);
const pendingDeposits = ref(0);
const failedDeposits = ref(0);
const cancelledDeposits = ref(0);
const totalDepositAmount = ref(0);
const completedDepositAmount = ref(0);
const pendingDepositAmount = ref(0);
const error = ref(null);

// Track if data is already fetched
const isFetched = ref({
  totalDeposits: false,
  completedDeposits: false,
  pendingDeposits: false,
  failedDeposits: false,
  cancelledDeposits: false,
  totalDepositAmount: false,
  pendingDepositAmount: false,
});

export function useDepositStats() {
  
  // Get deposits list (ye function table ke liye)
  const fetchDeposits = async (page = 1, filters = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: filters.per_page?.toString() || '15',
      });
      
      if (filters.user_id) {
        params.append('user_id', filters.user_id);
      }
      if (filters.status && filters.status !== '') {
        params.append('status', filters.status);
      }

      const response = await apiGet(`/admin/wallet/deposits?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.deposits) {
          return {
            success: true,
            deposits: data.data.deposits.data || [],
            currentPage: data.data.deposits.current_page || 1,
            lastPage: data.data.deposits.last_page || 1,
            total: data.data.deposits.total || 0,
          };
        }
      }
      return { success: false, deposits: [], currentPage: 1, lastPage: 1, total: 0 };
    } catch (err) {
      console.error('Error fetching deposits:', err);
      error.value = err.message;
      return { success: false, deposits: [], currentPage: 1, lastPage: 1, total: 0 };
    } finally {
      loading.value = false;
    }
  };

  // Total deposits count (all statuses)
  const fetchTotalDeposits = async (force = false) => {
    if (isFetched.value.totalDeposits && !force) {
      console.log('Total deposits already fetched, skipping...');
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        per_page: '1',
      });

      const response = await apiGet(`/admin/wallet/deposits?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.deposits) {
          totalDeposits.value = data.data.deposits.total || 0;
          isFetched.value.totalDeposits = true;
        }
      } else {
        error.value = 'Failed to fetch total deposits';
      }
    } catch (err) {
      console.error('Error fetching total deposits:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Completed deposits count
  const fetchCompletedDeposits = async (force = false) => {
    if (isFetched.value.completedDeposits && !force) {
      console.log('Completed deposits already fetched, skipping...');
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'completed',
        per_page: '1',
      });

      const response = await apiGet(`/admin/wallet/deposits?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.deposits) {
          completedDeposits.value = data.data.deposits.total || 0;
          isFetched.value.completedDeposits = true;
        }
      } else {
        error.value = 'Failed to fetch completed deposits';
      }
    } catch (err) {
      console.error('Error fetching completed deposits:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Pending deposits count
  const fetchPendingDeposits = async (force = false) => {
    if (isFetched.value.pendingDeposits && !force) {
      console.log('Pending deposits already fetched, skipping...');
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'pending',
        per_page: '1',
      });

      const response = await apiGet(`/admin/wallet/deposits?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.deposits) {
          pendingDeposits.value = data.data.deposits.total || 0;
          isFetched.value.pendingDeposits = true;
        }
      } else {
        error.value = 'Failed to fetch pending deposits';
      }
    } catch (err) {
      console.error('Error fetching pending deposits:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Failed deposits count
  const fetchFailedDeposits = async (force = false) => {
    if (isFetched.value.failedDeposits && !force) {
      console.log('Failed deposits already fetched, skipping...');
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'failed',
        per_page: '1',
      });

      const response = await apiGet(`/admin/wallet/deposits?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.deposits) {
          failedDeposits.value = data.data.deposits.total || 0;
          isFetched.value.failedDeposits = true;
        }
      } else {
        error.value = 'Failed to fetch failed deposits';
      }
    } catch (err) {
      console.error('Error fetching failed deposits:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Cancelled deposits count
  const fetchCancelledDeposits = async (force = false) => {
    if (isFetched.value.cancelledDeposits && !force) {
      console.log('Cancelled deposits already fetched, skipping...');
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'cancelled',
        per_page: '1',
      });

      const response = await apiGet(`/admin/wallet/deposits?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.deposits) {
          cancelledDeposits.value = data.data.deposits.total || 0;
          isFetched.value.cancelledDeposits = true;
        }
      } else {
        error.value = 'Failed to fetch cancelled deposits';
      }
    } catch (err) {
      console.error('Error fetching cancelled deposits:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Total deposit amount (SIMPLIFIED - no loop)
  const fetchTotalDepositAmount = async (force = false) => {
    if (isFetched.value.totalDepositAmount && !force) {
      console.log('Total deposit amount already fetched, skipping...');
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'completed',
        per_page: '100', // First 100 only - MUCH FASTER
      });

      const response = await apiGet(`/admin/wallet/deposits?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Total Amount API Response:', data);
        
        if (data?.success && data?.data) {
          // Check if backend provides total_amount directly
          if (data.data.total_amount !== undefined) {
            totalDepositAmount.value = parseFloat(data.data.total_amount || 0);
            isFetched.value.totalDepositAmount = true;
          } else if (data.data.deposits?.total_amount !== undefined) {
            totalDepositAmount.value = parseFloat(data.data.deposits.total_amount || 0);
            isFetched.value.totalDepositAmount = true;
          } else if (data.data.deposits?.data) {
            // Calculate from first 100 records only
            const deposits = data.data.deposits.data || [];
            totalDepositAmount.value = deposits.reduce((sum, deposit) => {
              return sum + parseFloat(deposit.amount || 0);
            }, 0);
            isFetched.value.totalDepositAmount = true;
            console.log('Calculated Total (first 100):', totalDepositAmount.value);
          }
        }
      } else {
        error.value = 'Failed to fetch deposit amount';
      }
    } catch (err) {
      console.error('Error fetching total deposit amount:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Pending deposit amount (SIMPLIFIED)
  const fetchPendingDepositAmount = async (force = false) => {
    if (isFetched.value.pendingDepositAmount && !force) {
      console.log('Pending deposit amount already fetched, skipping...');
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'pending',
        per_page: '100', // First 100 only
      });

      const response = await apiGet(`/admin/wallet/deposits?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.deposits?.data) {
          const deposits = data.data.deposits.data || [];
          pendingDepositAmount.value = deposits.reduce((sum, deposit) => {
            return sum + parseFloat(deposit.amount || 0);
          }, 0);
          isFetched.value.pendingDepositAmount = true;
        }
      } else {
        error.value = 'Failed to fetch pending deposit amount';
      }
    } catch (err) {
      console.error('Error fetching pending deposit amount:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Get deposits for chart (with date range)
  const fetchDepositsForChart = async (period = '1month') => {
    loading.value = true;
    error.value = null;
    
    try {
      const now = new Date();
      let startDate = new Date();
      
      // Calculate start date based on period
      if (period === '1month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (period === '3months') {
        startDate.setMonth(now.getMonth() - 3);
      } else if (period === '6months') {
        startDate.setMonth(now.getMonth() - 6);
      } else if (period === '1year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // Fetch all completed deposits (API might not support date filtering)
      const params = new URLSearchParams({
        status: 'completed',
        per_page: '100', // API limit is 100 per page
      });

      const response = await apiGet(`/admin/wallet/deposits?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.deposits?.data) {
          const deposits = data.data.deposits.data || [];
          // Filter by date on frontend
          return deposits.filter(deposit => {
            const depositDate = new Date(deposit.created_at || deposit.date);
            return depositDate >= startDate && depositDate <= now;
          });
        }
      }
      return [];
    } catch (err) {
      console.error('Error fetching deposits for chart:', err);
      error.value = err.message;
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Reset cache (jab approve/reject ho)
  const resetCache = () => {
    isFetched.value = {
      totalDeposits: false,
      completedDeposits: false,
      pendingDeposits: false,
      failedDeposits: false,
      cancelledDeposits: false,
      totalDepositAmount: false,
      pendingDepositAmount: false,
    };
  };

  return {
    loading,
    totalDeposits,
    completedDeposits,
    pendingDeposits,
    failedDeposits,
    cancelledDeposits,
    totalDepositAmount,
    completedDepositAmount,
    pendingDepositAmount,
    error,
    fetchDeposits,
    fetchTotalDeposits,
    fetchCompletedDeposits,
    fetchPendingDeposits,
    fetchFailedDeposits,
    fetchCancelledDeposits,
    fetchTotalDepositAmount,
    fetchPendingDepositAmount,
    fetchDepositsForChart,
    resetCache,
  };
}