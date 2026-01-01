<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BankAccounts from '@/views/User/components/BankAccounts.vue';
import CryptoWallets from '@/views/User/components/CryptoWallets.vue';
import Deposit from '@/views/User/components/Deposit.vue';
import Withdrawal from '@/views/User/components/Withdrawal.vue';
import Transactions from '@/views/User/components/Transactions.vue';
import InternalTransfer from '@/views/User/components/InternalTransfer.vue';

const route = useRoute();
const router = useRouter();

// Tab state
const activeTab = ref('deposit'); // 'deposit', 'withdrawal', 'transactions', 'bank', 'crypto', 'internal-transfer'

// Function to update tab from route query
const updateTabFromRoute = () => {
  const tabParam = route.query.tab;
  if (tabParam && ['deposit', 'withdrawal', 'transactions', 'bank', 'crypto', 'internal-transfer'].includes(tabParam)) {
    activeTab.value = tabParam;
  } else if (!tabParam) {
    // Default to deposit if no tab parameter
    activeTab.value = 'deposit';
  }
};

// Horizontal scroll state
const scrollContainer = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);

// Watch for tab changes
const switchTab = (tab) => {
  activeTab.value = tab;
  // Update URL query parameter
  router.push({ 
    path: route.path, 
    query: { ...route.query, tab: tab } 
  }).catch(() => {});
  // Scroll active tab into view on mobile
  nextTick(() => {
    if (scrollContainer.value) {
      const activeButton = scrollContainer.value.querySelector('.mobile-tab.active');
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      setTimeout(checkScrollPosition, 300);
    }
  });
};

// Check scroll position for horizontal tabs
const checkScrollPosition = () => {
  if (scrollContainer.value) {
    const container = scrollContainer.value;
    canScrollLeft.value = container.scrollLeft > 0;
    canScrollRight.value = container.scrollLeft < (container.scrollWidth - container.clientWidth - 10);
  }
};

// Scroll horizontal tabs
const scrollTabs = (direction) => {
  if (scrollContainer.value) {
    const scrollAmount = 200;
    scrollContainer.value.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(checkScrollPosition, 300);
  }
};

// Watch for route query changes to update active tab
watch(() => route.query.tab, () => {
  updateTabFromRoute();
  nextTick(() => {
    checkScrollPosition();
  });
}, { immediate: true });

// Check for tab query parameter on mount
onMounted(() => {
  updateTabFromRoute();
  nextTick(() => {
    checkScrollPosition();
    if (scrollContainer.value) {
      scrollContainer.value.addEventListener('scroll', checkScrollPosition);
      // Check scroll position on resize
      window.addEventListener('resize', checkScrollPosition);
    }
  });
});

// Cleanup event listeners
onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', checkScrollPosition);
  }
  window.removeEventListener('resize', checkScrollPosition);
});
</script>

<template>
  <div class="container-fluid py-4">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <!-- Desktop Tabs Navigation -->
        <ul class="nav nav-tabs mb-4 desktop-tabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'deposit' }"
              @click="switchTab('deposit')"
              type="button"
            >
              <i class="fas fa-arrow-down me-2"></i>
              Deposit
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'withdrawal' }"
              @click="switchTab('withdrawal')"
              type="button"
            >
              <i class="fas fa-arrow-up me-2"></i>
              Withdrawal
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'transactions' }"
              @click="switchTab('transactions')"
              type="button"
            >
              <i class="fas fa-history me-2"></i>
              Transactions
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'bank' }"
              @click="switchTab('bank')"
              type="button"
            >
              <i class="fas fa-university me-2"></i>
              Bank Accounts
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'crypto' }"
              @click="switchTab('crypto')"
              type="button"
            >
              <i class="fas fa-coins me-2"></i>
              Crypto Wallets
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'internal-transfer' }"
              @click="switchTab('internal-transfer')"
              type="button"
            >
              <i class="fas fa-exchange-alt me-2"></i>
              Internal Transfer
            </button>
          </li>
        </ul>

        <!-- Mobile Vertical Menu -->
        <div class="mobile-vertical-menu mb-4">
          <div 
            class="menu-item"
            :class="{ active: activeTab === 'deposit' }"
            @click="switchTab('deposit')"
          >
            <i class="fas fa-arrow-down menu-icon"></i>
            <span>Deposit</span>
          </div>
          <div 
            class="menu-item"
            :class="{ active: activeTab === 'withdrawal' }"
            @click="switchTab('withdrawal')"
          >
            <i class="fas fa-arrow-up menu-icon"></i>
            <span>Withdrawal</span>
          </div>
          <div 
            class="menu-item"
            :class="{ active: activeTab === 'transactions' }"
            @click="switchTab('transactions')"
          >
            <i class="fas fa-history menu-icon"></i>
            <span>Transactions</span>
          </div>
          <div 
            class="menu-item"
            :class="{ active: activeTab === 'bank' }"
            @click="switchTab('bank')"
          >
            <i class="fas fa-university menu-icon"></i>
            <span>Bank Accounts</span>
          </div>
          <div 
            class="menu-item"
            :class="{ active: activeTab === 'crypto' }"
            @click="switchTab('crypto')"
          >
            <i class="fas fa-coins menu-icon"></i>
            <span>Crypto Wallets</span>
          </div>
          <div 
            class="menu-item"
            :class="{ active: activeTab === 'internal-transfer' }"
            @click="switchTab('internal-transfer')"
          >
            <i class="fas fa-exchange-alt menu-icon"></i>
            <span>Internal Transfer</span>
          </div>
        </div>

        <!-- Mobile Horizontal Scrollable Tabs -->
        <div class="mobile-horizontal-tabs mb-4">
          <button 
            class="scroll-button scroll-left"
            @click="scrollTabs('left')"
            :disabled="!canScrollLeft"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <div class="tabs-scroll-container" ref="scrollContainer">
            <button
              class="mobile-tab"
              :class="{ active: activeTab === 'deposit' }"
              @click="switchTab('deposit')"
              type="button"
            >
              Deposit
            </button>
            <button
              class="mobile-tab"
              :class="{ active: activeTab === 'withdrawal' }"
              @click="switchTab('withdrawal')"
              type="button"
            >
              Withdrawal
            </button>
            <button
              class="mobile-tab"
              :class="{ active: activeTab === 'transactions' }"
              @click="switchTab('transactions')"
              type="button"
            >
              Transactions
            </button>
            <button
              class="mobile-tab"
              :class="{ active: activeTab === 'bank' }"
              @click="switchTab('bank')"
              type="button"
            >
              Bank Accounts
            </button>
            <button
              class="mobile-tab"
              :class="{ active: activeTab === 'crypto' }"
              @click="switchTab('crypto')"
              type="button"
            >
              Crypto Wallets
            </button>
            <button
              class="mobile-tab"
              :class="{ active: activeTab === 'internal-transfer' }"
              @click="switchTab('internal-transfer')"
              type="button"
            >
              Internal Transfer
            </button>
          </div>
          <button 
            class="scroll-button scroll-right"
            @click="scrollTabs('right')"
            :disabled="!canScrollRight"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>

        <!-- Deposit Tab Content -->
        <div v-show="activeTab === 'deposit'" class="tab-content">
          <Deposit />
        </div>

        <!-- Withdrawal Tab Content -->
        <div v-show="activeTab === 'withdrawal'" class="tab-content">
          <Withdrawal />
        </div>

        <!-- Transactions Tab Content -->
        <div v-show="activeTab === 'transactions'" class="tab-content">
          <Transactions />
        </div>

        <!-- Bank Accounts Tab Content -->
        <div v-show="activeTab === 'bank'" class="tab-content">
          <BankAccounts />
        </div>

        <!-- Crypto Wallets Tab Content -->
        <div v-show="activeTab === 'crypto'" class="tab-content">
          <CryptoWallets />
        </div>

        <!-- Internal Transfer Tab Content -->
        <div v-show="activeTab === 'internal-transfer'" class="tab-content">
          <InternalTransfer />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card { background-color: white; border-radius: 0.5rem; }

/* Desktop Tabs */
.desktop-tabs {
  display: flex;
  border-bottom: 2px solid #e9ecef;
}
.desktop-tabs .nav-link {
  color: #6c757d;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
}
.desktop-tabs .nav-link:hover {
  color: #000;
  border-bottom-color: #dee2e6;
}
.desktop-tabs .nav-link.active {
  color: #000;
  background-color: transparent;
  border-bottom-color: #000;
  font-weight: 600;
}

/* Mobile Vertical Menu - Hidden on desktop */
.mobile-vertical-menu {
  display: none;
}

/* Mobile Horizontal Tabs - Hidden on desktop */
.mobile-horizontal-tabs {
  display: none;
}

/* Mobile Styles */
@media (max-width: 768px) {
  /* Hide desktop tabs on mobile */
  .desktop-tabs {
    display: none;
  }

  /* Hide mobile vertical menu */
  .mobile-vertical-menu {
    display: none;
  }

  /* Show mobile horizontal tabs */
  .mobile-horizontal-tabs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    position: relative;
  }

  .scroll-button {
    width: 36px;
    height: 36px;
    border: none;
    background-color: #f5f5f5;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }

  .scroll-button:hover:not(:disabled) {
    background-color: #e9ecef;
  }

  .scroll-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .scroll-button i {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .tabs-scroll-container {
    display: flex;
    overflow-x: auto;
    scroll-behavior: smooth;
    gap: 0;
    flex: 1;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    align-items: center;
  }

  .tabs-scroll-container::-webkit-scrollbar {
    display: none;
  }

  .mobile-tab {
    padding: 0.625rem 1rem;
    border: none;
    background: transparent;
    color: #9ca3af;
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .mobile-tab:hover {
    color: #6b7280;
  }

  .mobile-tab.active {
    color: #000;
    font-weight: 600;
  }

  .mobile-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #000;
  }
}

/* Smaller mobile devices */
@media (max-width: 576px) {
  .mobile-tab {
    padding: 0.5rem 0.875rem;
    font-size: 0.8125rem;
  }

  .scroll-button {
    width: 32px;
    height: 32px;
  }

  .scroll-button i {
    font-size: 0.75rem;
  }
}
</style>
