// ============================================================================
// TRADING ACCOUNTS COMPOSABLE - Vue 3 Composition API
// ============================================================================
// Ye composable trading accounts ki complete logic handle karta hai
// Isko kisi bhi Vue component mein import karke use kar sakte ho

import { ref, computed } from 'vue';
import { apiGet, apiPost } from '@/utils/api.js';

// ============================================================================
// SHARED STATE - Ye state sabhi components mein shared hoga
// ============================================================================
const tradingAccounts = ref([]);
const accountTypes = ref([]);
const leverages = ref([]);
const loading = ref(false);
const accountsLoaded = ref(false);

// ============================================================================
// MAIN COMPOSABLE FUNCTION
// ============================================================================
export function useTradingAccounts() {
  // Local state for specific operations
  const isCreating = ref(false);
  const errorMessage = ref('');
  const successMessage = ref('');

  // ==========================================================================
  // API METHODS - Backend se data fetch karne ke liye
  // ==========================================================================

  /**
   * Trading Accounts fetch karo with retry logic
   * @param {boolean} forceRefresh - true pass karo agar fresh data chahiye
   * @param {number} retries - kitni baar retry karni hai
   */
  const fetchTradingAccounts = async (forceRefresh = false, retries = 2) => {
    // Agar already loaded hai aur force refresh nahi chahiye, toh cached data return karo
    if (accountsLoaded.value && !forceRefresh) {
      return tradingAccounts.value;
    }

    loading.value = true;
    errorMessage.value = '';
    
    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await apiGet('/client/mt5/accounts');
        const data = await response.json();
        
        if (data.success && data.data && data.data.trading_accounts) {
          tradingAccounts.value = data.data.trading_accounts;
          accountsLoaded.value = true;
          errorMessage.value = '';
          loading.value = false;
          return tradingAccounts.value;
        } else {
          tradingAccounts.value = [];
          loading.value = false;
          return tradingAccounts.value;
        }
      } catch (error) {
        console.error(`Error fetching trading accounts (attempt ${attempt + 1}/${retries + 1}):`, error);
        
        // Agar timeout error hai aur retries remaining hain
        if (attempt < retries) {
          // Wait for 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // Last attempt failed
        tradingAccounts.value = [];
        loading.value = false;
        
        // Set user-friendly error message
        if (error.message?.includes('timeout')) {
          errorMessage.value = 'Request timeout. Please check your connection and try again.';
        } else if (error.message?.includes('Network')) {
          errorMessage.value = 'Network error. Please check your internet connection.';
        } else {
          errorMessage.value = 'Failed to load trading accounts. Please try again.';
        }
        
        throw error;
      }
    }
  };

  /**
   * Account Types fetch karo with error handling
   */
  const fetchAccountTypes = async (retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await apiGet('/client/account-types');
        const data = await response.json();
        
        if (data.success && data.data && data.data.account_types) {
          // Sirf active account types return karo
          accountTypes.value = data.data.account_types.filter(type => type.is_active);
        } else {
          accountTypes.value = [];
        }
        
        return accountTypes.value;
      } catch (error) {
        console.error(`Error fetching account types (attempt ${attempt + 1}/${retries + 1}):`, error);
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // All attempts failed
        accountTypes.value = [];
        // Don't throw, just return empty array
        return accountTypes.value;
      }
    }
    
    return accountTypes.value;
  };

  /**
   * Leverages fetch karo with error handling
   */
  const fetchLeverages = async (retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await apiGet('/client/leverages');
        const data = await response.json();
        
        if (data.success && data.data && data.data.leverages) {
          // Sirf active leverages return karo
          leverages.value = data.data.leverages.filter(lev => lev.is_active);
        } else {
          leverages.value = [];
        }
        
        return leverages.value;
      } catch (error) {
        console.error(`Error fetching leverages (attempt ${attempt + 1}/${retries + 1}):`, error);
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // All attempts failed
        leverages.value = [];
        // Don't throw, just return empty array
        return leverages.value;
      }
    }
    
    return leverages.value;
  };

  /**
   * Naya trading account create karo
   * @param {Object} accountData - {account_type_id, leverage_id, account_title}
   */
  const createTradingAccount = async (accountData) => {
    if (!accountData.account_type_id || !accountData.leverage_id) {
      throw new Error('Account type aur leverage dono required hain');
    }

    isCreating.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    try {
      const response = await apiPost('/client/mt5/accounts/create', {
        leverage_id: accountData.leverage_id,
        account_type_id: accountData.account_type_id,
        account_title: accountData.account_title || 'METATRADER 5'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        successMessage.value = 'Trading account successfully create ho gaya!';
        
        // Accounts list ko refresh karo
        await fetchTradingAccounts(true);
        
        return { success: true, data: data.data, message: successMessage.value };
      } else {
        errorMessage.value = data.message || 'Trading account create nahi ho saka';
        return { success: false, message: errorMessage.value };
      }
    } catch (error) {
      console.error('Error creating account:', error);
      errorMessage.value = 'Koi error aa gayi hai. Phir se try karo.';
      return { success: false, message: errorMessage.value };
    } finally {
      isCreating.value = false;
    }
  };

  // ==========================================================================
  // HELPER METHODS - Data ko filter aur manipulate karne ke liye
  // ==========================================================================

  /**
   * ID se account nikalo
   */
  const getAccountById = (accountId) => {
    return tradingAccounts.value.find(account => account.id === accountId);
  };

  /**
   * Account type se filter karo
   */
  const getAccountsByType = (accountTypeId) => {
    if (!accountTypeId) {
      return tradingAccounts.value;
    }
    return tradingAccounts.value.filter(
      account => account.account_type?.id === accountTypeId
    );
  };

  /**
   * Status se filter karo (enabled/disabled)
   */
  const getAccountsByStatus = (status) => {
    return tradingAccounts.value.filter(account => account.status === status);
  };

  /**
   * Currency format karo
   */
  const formatCurrency = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  /**
   * Account type by ID
   */
  const getAccountTypeById = (typeId) => {
    return accountTypes.value.find(type => type.id === typeId);
  };

  /**
   * Leverage by ID
   */
  const getLeverageById = (leverageId) => {
    return leverages.value.find(lev => lev.id === leverageId);
  };

  /**
   * Sab data refresh karo
   */
  const refreshAllData = async () => {
    loading.value = true;
    try {
      await Promise.all([
        fetchTradingAccounts(true),
        fetchAccountTypes(),
        fetchLeverages()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Error aur success messages clear karo
   */
  const clearMessages = () => {
    errorMessage.value = '';
    successMessage.value = '';
  };

  // ==========================================================================
  // COMPUTED PROPERTIES - Reactive calculations
  // ==========================================================================

  /**
   * Sabhi accounts ka total balance
   */
  const getTotalBalance = computed(() => {
    return tradingAccounts.value.reduce((total, account) => {
      const balance = parseFloat(account.balance) || 0;
      return total + balance;
    }, 0);
  });

  /**
   * Sabhi accounts ka total equity
   */
  const getTotalEquity = computed(() => {
    return tradingAccounts.value.reduce((total, account) => {
      const equity = parseFloat(account.equity) || 0;
      return total + equity;
    }, 0);
  });

  /**
   * Total accounts count
   */
  const getAccountsCount = computed(() => {
    return tradingAccounts.value.length;
  });

  /**
   * Enabled accounts count
   */
  const getEnabledAccountsCount = computed(() => {
    return tradingAccounts.value.filter(account => account.status === 'enabled').length;
  });

  /**
   * Accounts ko type ke hisab se group karo
   */
  const getAccountsGroupedByType = computed(() => {
    const grouped = {};
    
    tradingAccounts.value.forEach(account => {
      const typeName = account.account_type?.name || 'Demo';
      if (!grouped[typeName]) {
        grouped[typeName] = [];
      }
      grouped[typeName].push(account);
    });
    
    return grouped;
  });

  // ==========================================================================
  // RETURN - Yeh sab functions aur state return karo
  // ==========================================================================
  return {
    // State
    tradingAccounts,
    accountTypes,
    leverages,
    loading,
    isCreating,
    errorMessage,
    successMessage,
    accountsLoaded,

    // API Methods
    fetchTradingAccounts,
    fetchAccountTypes,
    fetchLeverages,
    createTradingAccount,
    refreshAllData,

    // Helper Methods
    getAccountById,
    getAccountsByType,
    getAccountsByStatus,
    getAccountTypeById,
    getLeverageById,
    clearMessages,
    formatCurrency,

    // Computed Properties
    getTotalBalance,
    getTotalEquity,
    getAccountsCount,
    getEnabledAccountsCount,
    getAccountsGroupedByType
  };
}