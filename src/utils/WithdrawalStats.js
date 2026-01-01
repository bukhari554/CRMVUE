// composables/useWithdrawalStats.js
import { ref } from 'vue';
import { apiGet } from '@/utils/api.js';

// ✅ SHARED STATE - Outside function (singleton pattern)
const loading = ref(false);
const totalWithdrawals = ref(0);
const completedWithdrawals = ref(0);
const pendingWithdrawals = ref(0);
const failedWithdrawals = ref(0);
const cancelledWithdrawals = ref(0);
const totalWithdrawalAmount = ref(0);
const completedWithdrawalAmount = ref(0);
const pendingWithdrawalAmount = ref(0);
const error = ref(null);

// Track if data is already fetched
const isFetched = ref({
  totalWithdrawals: false,
  completedWithdrawals: false,
  pendingWithdrawals: false,
  failedWithdrawals: false,
  cancelledWithdrawals: false,
  totalWithdrawalAmount: false,
  pendingWithdrawalAmount: false,
});

export function useWithdrawalStats() {
  
  // Get withdrawals list (ye function table ke liye)
  const fetchWithdrawals = async (page = 1, filters = {}) => {
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

      const response = await apiGet(`/admin/wallet/withdrawals?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.withdrawals) {
          return {
            success: true,
            withdrawals: data.data.withdrawals.data || [],
            currentPage: data.data.withdrawals.current_page || 1,
            lastPage: data.data.withdrawals.last_page || 1,
            total: data.data.withdrawals.total || 0,
          };
        }
      }
      return { success: false, withdrawals: [], currentPage: 1, lastPage: 1, total: 0 };
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
      error.value = err.message;
      return { success: false, withdrawals: [], currentPage: 1, lastPage: 1, total: 0 };
    } finally {
      loading.value = false;
    }
  };

  // Total withdrawals count (all statuses)
  const fetchTotalWithdrawals = async (force = false) => {
    if (isFetched.value.totalWithdrawals && !force) {
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        per_page: '1',
      });

      const response = await apiGet(`/admin/wallet/withdrawals?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.withdrawals) {
          totalWithdrawals.value = data.data.withdrawals.total || 0;
          isFetched.value.totalWithdrawals = true;
        }
      } else {
        error.value = 'Failed to fetch total withdrawals';
      }
    } catch (err) {
      console.error('Error fetching total withdrawals:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Completed withdrawals count
  const fetchCompletedWithdrawals = async (force = false) => {
    if (isFetched.value.completedWithdrawals && !force) {
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'completed',
        per_page: '1',
      });

      const response = await apiGet(`/admin/wallet/withdrawals?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.withdrawals) {
          completedWithdrawals.value = data.data.withdrawals.total || 0;
          isFetched.value.completedWithdrawals = true;
        }
      } else {
        error.value = 'Failed to fetch completed withdrawals';
      }
    } catch (err) {
      console.error('Error fetching completed withdrawals:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Pending withdrawals count
  const fetchPendingWithdrawals = async (force = false) => {
    if (isFetched.value.pendingWithdrawals && !force) {
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'pending',
        per_page: '1',
      });

      const response = await apiGet(`/admin/wallet/withdrawals?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.withdrawals) {
          pendingWithdrawals.value = data.data.withdrawals.total || 0;
          isFetched.value.pendingWithdrawals = true;
        }
      } else {
        error.value = 'Failed to fetch pending withdrawals';
      }
    } catch (err) {
      console.error('Error fetching pending withdrawals:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Failed withdrawals count
  const fetchFailedWithdrawals = async (force = false) => {
    if (isFetched.value.failedWithdrawals && !force) {
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'failed',
        per_page: '1',
      });

      const response = await apiGet(`/admin/wallet/withdrawals?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.withdrawals) {
          failedWithdrawals.value = data.data.withdrawals.total || 0;
          isFetched.value.failedWithdrawals = true;
        }
      } else {
        error.value = 'Failed to fetch failed withdrawals';
      }
    } catch (err) {
      console.error('Error fetching failed withdrawals:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Cancelled withdrawals count
  const fetchCancelledWithdrawals = async (force = false) => {
    if (isFetched.value.cancelledWithdrawals && !force) {
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'cancelled',
        per_page: '1',
      });

      const response = await apiGet(`/admin/wallet/withdrawals?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.withdrawals) {
          cancelledWithdrawals.value = data.data.withdrawals.total || 0;
          isFetched.value.cancelledWithdrawals = true;
        }
      } else {
        error.value = 'Failed to fetch cancelled withdrawals';
      }
    } catch (err) {
      console.error('Error fetching cancelled withdrawals:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Total withdrawal amount (completed only)
  const fetchTotalWithdrawalAmount = async (force = false) => {
    if (isFetched.value.totalWithdrawalAmount && !force) {
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'completed',
        per_page: '100', // First 100 only - MUCH FASTER
      });

      const response = await apiGet(`/admin/wallet/withdrawals?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data?.success && data?.data) {
          // Check if backend provides total_amount directly
          if (data.data.total_amount !== undefined) {
            totalWithdrawalAmount.value = parseFloat(data.data.total_amount || 0);
            isFetched.value.totalWithdrawalAmount = true;
          } else if (data.data.withdrawals?.total_amount !== undefined) {
            totalWithdrawalAmount.value = parseFloat(data.data.withdrawals.total_amount || 0);
            isFetched.value.totalWithdrawalAmount = true;
          } else if (data.data.withdrawals?.data) {
            // Calculate from first 100 records only
            const withdrawals = data.data.withdrawals.data || [];
            totalWithdrawalAmount.value = withdrawals.reduce((sum, withdrawal) => {
              return sum + parseFloat(withdrawal.amount || 0);
            }, 0);
            isFetched.value.totalWithdrawalAmount = true;
          }
        }
      } else {
        error.value = 'Failed to fetch withdrawal amount';
      }
    } catch (err) {
      console.error('Error fetching total withdrawal amount:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Pending withdrawal amount
  const fetchPendingWithdrawalAmount = async (force = false) => {
    if (isFetched.value.pendingWithdrawalAmount && !force) {
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        status: 'pending',
        per_page: '100', // First 100 only
      });

      const response = await apiGet(`/admin/wallet/withdrawals?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.withdrawals?.data) {
          const withdrawals = data.data.withdrawals.data || [];
          pendingWithdrawalAmount.value = withdrawals.reduce((sum, withdrawal) => {
            return sum + parseFloat(withdrawal.amount || 0);
          }, 0);
          isFetched.value.pendingWithdrawalAmount = true;
        }
      } else {
        error.value = 'Failed to fetch pending withdrawal amount';
      }
    } catch (err) {
      console.error('Error fetching pending withdrawal amount:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Get withdrawals for chart (with date range)
  const fetchWithdrawalsForChart = async (period = '1month') => {
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

      // Fetch all completed withdrawals (API might not support date filtering)
      const params = new URLSearchParams({
        status: 'completed',
        per_page: '100', // API limit is 100 per page
      });

      const response = await apiGet(`/admin/wallet/withdrawals?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.withdrawals?.data) {
          const withdrawals = data.data.withdrawals.data || [];
          // Filter by date on frontend
          return withdrawals.filter(withdrawal => {
            const withdrawalDate = new Date(withdrawal.created_at || withdrawal.date);
            return withdrawalDate >= startDate && withdrawalDate <= now;
          });
        }
      }
      return [];
    } catch (err) {
      console.error('Error fetching withdrawals for chart:', err);
      error.value = err.message;
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Reset cache
  const resetCache = () => {
    isFetched.value = {
      totalWithdrawals: false,
      completedWithdrawals: false,
      pendingWithdrawals: false,
      failedWithdrawals: false,
      cancelledWithdrawals: false,
      totalWithdrawalAmount: false,
      pendingWithdrawalAmount: false,
    };
  };

  return {
    loading,
    totalWithdrawals,
    completedWithdrawals,
    pendingWithdrawals,
    failedWithdrawals,
    cancelledWithdrawals,
    totalWithdrawalAmount,
    completedWithdrawalAmount,
    pendingWithdrawalAmount,
    error,
    fetchWithdrawals,
    fetchTotalWithdrawals,
    fetchCompletedWithdrawals,
    fetchPendingWithdrawals,
    fetchFailedWithdrawals,
    fetchCancelledWithdrawals,
    fetchTotalWithdrawalAmount,
    fetchPendingWithdrawalAmount,
    fetchWithdrawalsForChart,
    resetCache,
  };
}

