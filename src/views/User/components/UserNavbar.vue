<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import { apiPost, apiGet, apiPatch } from "@/utils/api.js";
import ArgonButton from "@/components/ArgonButton.vue";

/* eslint-disable no-unused-vars */

const showMenu = ref(false);
const showUserMenu = ref(false);
const showMobileMenu = ref(false);
const showInfoToolsMenu = ref(false);
const showInfoToolsSubmenu = ref(false);
const showWalletMenu = ref(false);
const showWalletSubmenu = ref(false);
const showMobileWalletMenu = ref(false);
const showMobileInfoToolsMenu = ref(false);
const isLoggingOut = ref(false);
const infoToolsButton = ref(null);
const walletButton = ref(null);
const infoToolsTimeout = ref(null);
const submenuTimeout = ref(null);
const walletTimeout = ref(null);
const walletSubmenuTimeout = ref(null);
const store = useStore();
const router = useRouter();

const route = useRoute();

// Notification state
const notifications = ref([]);
const loadingNotifications = ref(false);
const showNotifications = ref(false);
const notificationError = ref("");
const lastNotificationsFetchAt = ref(0);

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read_at).length;
});

const currentRouteName = computed(() => {
  return route.name;
});

// Check if current route is a wallet tab
const isWalletTab = computed(() => {
  return route.name === 'Wallet' && route.query.tab;
});

const isActiveWalletTab = (tab) => {
  if (route.name !== 'Wallet') return false;
  if (!route.query.tab && tab === 'deposit') return true; // Default to deposit
  return route.query.tab === tab;
};

// User pages navigation menu
const userPages = [
  { name: 'Dashboard', path: '/user/dashboard', icon: 'fa-tachometer-alt', routeName: 'UserDashboard' },
  { name: 'Profile', path: '/user/profile', icon: 'fa-user', routeName: 'UserProfile' },
  { name: 'Wallet', path: '/user/wallet', icon: "fa-solid fa fa-wallet", routeName: 'Wallet' },
  { name: 'Trading Accounts', path: '/user/tradingaccounts', icon: "fa-solid fa-chart-line", routeName: 'TradingAccounts' },
  { name: 'KYC', path: '/user/userkyc', icon: "fa-solid fa-address-card", routeName: 'UserKYC' },
  { name: 'Support', path: '/user/tickets', icon: 'fa-headset', routeName: 'UserTickets' },
];

// Computed property to filter out Wallet from userPages (to avoid v-if with v-for)
const userPagesWithoutWallet = computed(() => {
  return userPages.filter(page => page.name !== 'Wallet');
});

// Computed properties for menu ordering
const dashboardPage = computed(() => {
  return userPages.find(page => page.name === 'Dashboard');
});

const profilePage = computed(() => {
  return userPages.find(page => page.name === 'Profile');
});

const remainingPages = computed(() => {
  return userPages.filter(page => page.name !== 'Dashboard' && page.name !== 'Profile' && page.name !== 'Wallet');
});

const isActivePage = (routeName) => {
  return currentRouteName.value === routeName;
};

const currentUser = computed(() => store.getters.currentUser);
const userName = computed(() => {
  if (currentUser.value) {
    return currentUser.value.name || 
           `${currentUser.value.first_name || ''} ${currentUser.value.last_name || ''}`.trim() ||
           currentUser.value.email;
  }
  return "User";
});

const toggleMobileMenu = (event) => {
  event?.stopPropagation();
  showMobileMenu.value = !showMobileMenu.value;
};

// Close dropdowns when clicking outside
const handleClickOutside = (event) => {
  const userMenuEl = document.getElementById('userMenuButton');
  const notifMenuEl = document.getElementById('dropdownMenuButton');
  const infoToolsDropdown = document.querySelector('.information-tools-popup');
  const infoToolsNavItem = document.querySelector('#infoToolsMenuButton')?.closest('.nav-item');
  const walletDropdown = document.querySelector('.wallet-popup');
  const walletNavItem = document.querySelector('#walletMenuButton')?.closest('.nav-item');
  
  if (userMenuEl && !userMenuEl.closest('.dropdown')?.contains(event.target)) {
    showUserMenu.value = false;
  }
  if (notifMenuEl && !notifMenuEl.closest('.dropdown')?.contains(event.target)) {
    showMenu.value = false;
  }
  // Close Information & Tools dropdown if clicking outside
  if (showInfoToolsMenu.value) {
    const infoToolsButton = document.getElementById('infoToolsMenuButton');
    // Don't close if clicking on the button itself (it will toggle)
    if (infoToolsButton && infoToolsButton.contains(event.target)) {
      return;
    }
    const clickedInside = 
      (infoToolsNavItem && infoToolsNavItem.contains(event.target)) ||
      (infoToolsDropdown && infoToolsDropdown.contains(event.target));
    if (!clickedInside) {
      showInfoToolsMenu.value = false;
    }
  }
  // Close Wallet dropdown if clicking outside
  if (showWalletMenu.value) {
    const walletBtn = document.getElementById('walletMenuButton');
    // Don't close if clicking on the button itself (it will toggle)
    if (walletBtn && walletBtn.contains(event.target)) {
      return;
    }
    const clickedInside = 
      (walletNavItem && walletNavItem.contains(event.target)) ||
      (walletDropdown && walletDropdown.contains(event.target));
    if (!clickedInside) {
      showWalletMenu.value = false;
    }
  }
  
  // Handle notification modal backdrop
  const target = event.target;
  const notificationDropdown = document.getElementById("notificationDropdown");
  const notificationButton = document.getElementById("notificationButton");
  
  if (
    showNotifications.value &&
    target.classList.contains('position-fixed') &&
    notificationDropdown &&
    !notificationDropdown.contains(target) &&
    notificationButton &&
    !notificationButton.contains(target)
  ) {
    showNotifications.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  // Prefetch so unread badge count appears immediately on navbar load
  // (doesn't open the modal; only loads data)
  ensureNotificationsLoaded();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (infoToolsTimeout.value) {
    clearTimeout(infoToolsTimeout.value);
  }
  if (submenuTimeout.value) {
    clearTimeout(submenuTimeout.value);
  }
  if (walletTimeout.value) {
    clearTimeout(walletTimeout.value);
  }
  if (walletSubmenuTimeout.value) {
    clearTimeout(walletSubmenuTimeout.value);
  }
});

const toggleUserMenu = (event) => {
  event.stopPropagation();
  showUserMenu.value = !showUserMenu.value;
  showMenu.value = false; // Close other dropdown
};


const toggleNotifMenu = (event) => {
  event.stopPropagation();
  showMenu.value = !showMenu.value;
  showUserMenu.value = false; // Close other dropdown
};

const toggleInfoToolsMenu = (event) => {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  showInfoToolsMenu.value = !showInfoToolsMenu.value;
  showWalletMenu.value = false; // Close wallet menu when opening info tools
  showUserMenu.value = false;
  showMenu.value = false;
  // Clear any pending timeout
  if (infoToolsTimeout.value) {
    clearTimeout(infoToolsTimeout.value);
    infoToolsTimeout.value = null;
  }
};

const toggleWalletMenu = (event) => {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  showWalletMenu.value = !showWalletMenu.value;
  showInfoToolsMenu.value = false; // Close info tools menu when opening wallet
  showUserMenu.value = false;
  showMenu.value = false;
  // Clear any pending timeout
  if (walletTimeout.value) {
    clearTimeout(walletTimeout.value);
    walletTimeout.value = null;
  }
};

const handleWalletLinkClick = () => {
  showWalletMenu.value = false;
  // Clear any pending timeout
  if (walletTimeout.value) {
    clearTimeout(walletTimeout.value);
    walletTimeout.value = null;
  }
};

const handleInfoToolsEnter = () => {
  if (infoToolsTimeout.value) {
    clearTimeout(infoToolsTimeout.value);
    infoToolsTimeout.value = null;
  }
  showInfoToolsMenu.value = true;
};

const handleInfoToolsLeave = () => {
  infoToolsTimeout.value = setTimeout(() => {
    showInfoToolsMenu.value = false;
    infoToolsTimeout.value = null;
  }, 200);
};

const handleSubmenuEnter = () => {
  if (submenuTimeout.value) {
    clearTimeout(submenuTimeout.value);
    submenuTimeout.value = null;
  }
  showInfoToolsSubmenu.value = true;
};

const handleSubmenuLeave = () => {
  submenuTimeout.value = setTimeout(() => {
    showInfoToolsSubmenu.value = false;
    submenuTimeout.value = null;
  }, 150);
};

const handleWalletEnter = () => {
  if (walletTimeout.value) {
    clearTimeout(walletTimeout.value);
    walletTimeout.value = null;
  }
  showWalletMenu.value = true;
};

const handleWalletLeave = () => {
  walletTimeout.value = setTimeout(() => {
    showWalletMenu.value = false;
    walletTimeout.value = null;
  }, 200);
};

const handleWalletSubmenuEnter = () => {
  if (walletSubmenuTimeout.value) {
    clearTimeout(walletSubmenuTimeout.value);
    walletSubmenuTimeout.value = null;
  }
  showWalletSubmenu.value = true;
};

const handleWalletSubmenuLeave = () => {
  walletSubmenuTimeout.value = setTimeout(() => {
    showWalletSubmenu.value = false;
    walletSubmenuTimeout.value = null;
  }, 150);
};

const getDropdownStyle = () => {
  if (!infoToolsButton.value) {
    return { display: 'none' };
  }
  const rect = infoToolsButton.value.getBoundingClientRect();
  return {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
    zIndex: '9999',
    display: 'block',
    visibility: 'visible',
    opacity: '1'
  };
};

const getWalletDropdownStyle = () => {
  if (!walletButton.value) {
    return { display: 'none' };
  }
  const rect = walletButton.value.getBoundingClientRect();
  return {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
    zIndex: '9999',
    display: 'block',
    visibility: 'visible',
    opacity: '1'
  };
};

const handleLogout = async (event) => {
  // Stop event bubbling
  event.stopPropagation();
  
  // Prevent double clicks
  if (isLoggingOut.value) return;
  isLoggingOut.value = true;
  
  console.log("🔄 Logout started...");
  
  try {
    const response = await apiPost("/client/logout", {});
    console.log("✅ Logout API response:", response);
  } catch (error) {
    console.error("❌ Logout API error:", error);
  }
  
  // Always cleanup and redirect (even if API fails)
  console.log("🧹 Cleaning up...");
  
  // Dispatch Vuex logout
  store.dispatch("logout");
  
  console.log("✅ Redirecting to login...");
  
  isLoggingOut.value = false;
  showUserMenu.value = false;
  
  // Redirect to login
  router.push("/signin");
};

// Notification functions
const loadNotifications = async () => {
  loadingNotifications.value = true;
  notificationError.value = "";
  try {
    const response = await apiGet("/client/notifications");
    const data = await response.json();
    
    if (data.success && data.data && data.data.notifications && data.data.notifications.data) {
      notifications.value = data.data.notifications.data;
    } else {
      notifications.value = [];
    }

    lastNotificationsFetchAt.value = Date.now();
  } catch (error) {
    console.error("Error loading notifications:", error);
    notificationError.value = "Failed to load notifications";
    notifications.value = [];
  } finally {
    loadingNotifications.value = false;
  }
};

const ensureNotificationsLoaded = async ({ force = false } = {}) => {
  const STALE_MS = 30_000;
  const isStale = !lastNotificationsFetchAt.value || (Date.now() - lastNotificationsFetchAt.value) > STALE_MS;
  if (force || isStale) {
    await loadNotifications();
  }
};

const toggleNotifications = (event) => {
  event?.stopPropagation();
  showNotifications.value = !showNotifications.value;
  showMenu.value = false; // Close other dropdown
  if (showNotifications.value && !loadingNotifications.value) {
    ensureNotificationsLoaded();
  }
};

const markAllRead = async () => {
  if (unreadCount.value === 0) return;
  
  try {
    const response = await apiPatch("/client/notifications/read-all", {});
    const data = await response.json();
    
    if (data.success || response.ok) {
      // Mark all notifications as read locally
      notifications.value = notifications.value.map(n => ({
        ...n,
        read_at: n.read_at || new Date().toISOString()
      }));
    }
  } catch (error) {
    console.error("Error marking all as read:", error);
    notificationError.value = "Failed to mark all as read";
  }
};

const markOneRead = async (notification) => {
  // Always hit the read API on click (even if already read),
  // but only optimistically update if unread.
  const wasRead = !!notification.read_at;
  const originalReadAt = notification.read_at;
  const notificationIndex = notifications.value.findIndex(n => n.id === notification.id);
  
  if (!wasRead && notificationIndex !== -1) {
    notifications.value[notificationIndex] = {
      ...notifications.value[notificationIndex],
      read_at: new Date().toISOString()
    };
  }
  
  try {
    // Use id from notification, fallback to index if id is not available
    const notificationId = notification.id || notificationIndex;
    const response = await apiPatch(`/client/notifications/${notificationId}/read`, {});
    const data = await response.json();
    
    if (!data.success && !response.ok) {
      // Revert on error
      if (!wasRead && notificationIndex !== -1) {
        notifications.value[notificationIndex] = {
          ...notifications.value[notificationIndex],
          read_at: originalReadAt
        };
      }
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    // Revert on error
    if (!wasRead && notificationIndex !== -1) {
      notifications.value[notificationIndex] = {
        ...notifications.value[notificationIndex],
        read_at: originalReadAt
      };
    }
  }
};

// Get notification title - use Name from API response
const getNotificationTitle = (notification) => {
  // Use Name from the new API structure
  if (notification?.Name) return notification.Name;
  
  // Fallback for older structure
  return notification?.title || notification?.subject || "Notification";
};

// Get notification message - use message from API response
const getNotificationMessage = (notification) => {
  // Use message from the new API structure
  if (notification?.message) return notification.message;
  
  // Fallback for older structure
  return notification?.body || "";
};

// Get notification date - parse from date field
const getNotificationCreatedAt = (notification) => {
  // New API structure has date field with format: "Submitted: 2025-12-18 14:23:23\nDate & Time: 2025-12-18 14:23:30"
  if (notification?.date) {
    // Extract the "Date & Time" part if available, otherwise use the first date
    const dateMatch = notification.date.match(/Date & Time:\s*([^\n]+)/);
    if (dateMatch) {
      return dateMatch[1].trim();
    }
    // Try to extract first date
    const firstDateMatch = notification.date.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
    if (firstDateMatch) {
      return firstDateMatch[1];
    }
    return notification.date;
  }
  
  // Fallback for older structure
  return notification?.data?.created_at || notification?.created_at || null;
};

// Get notification redirect based on type
const getNotificationRedirect = (notification) => {
  const type = notification?.type || "";
  const title = getNotificationTitle(notification) || "";
  const message = notification?.message || "";
  
  // Ticket/Support related notifications
  if (type.includes("ticket") || 
      title.toLowerCase().includes("ticket") || 
      message.toLowerCase().includes("ticket")) {
    return "/user/tickets";
  }
  
  // KYC related notifications
  if (type === "kyc_submitted_pending" || type === "document_status_updated") {
    return "/user/userkyc";
  }
  
  // Deposit related notifications
  if (type === "deposit_pending" || type === "deposit_approved" || type === "deposit_rejected" || type === "transaction_approved") {
    return "/user/wallet";
  }
  
  // Withdrawal notifications
  if (type === "withdrawal_pending") {
    return "/user/wallet";
  }
  
  // Transfer notifications
  if (type === "transfer_completed") {
    // Check message for direction to determine destination
    if (message.toLowerCase().includes("trading account")) {
      return "/user/tradingaccounts";
    }
    return "/user/wallet";
  }
  
  // Trading account notifications
  if (type === "trading_account_created") {
    return "/user/tradingaccounts";
  }
  
  return null;
};

const handleNotificationClick = async (notification) => {
  await markOneRead(notification);
  const redirectTo = getNotificationRedirect(notification);
  showNotifications.value = false;
  if (redirectTo) {
    router.push(redirectTo).catch(() => {});
  }
};

const formatTime = (dateString) => {
  if (!dateString) return "Unknown";
  
  try {
    // Handle the new date format: "2025-12-18 14:23:30"
    let date;
    if (typeof dateString === 'string' && dateString.includes(':')) {
      // Try parsing as "YYYY-MM-DD HH:mm:ss"
      date = new Date(dateString.replace(' ', 'T'));
    } else {
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if parsing fails
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    return dateString || "Unknown";
  }
};

</script>

<template>
  <nav class="navbar navbar-main navbar-expand-lg px-1 shadow-none border-radius-xl bg-white">
    <div class="px-3 py-1 container-fluid d-flex align-items-center" style="background-color: #ffffff !important;">
      <!-- Left Side: User Pages Navigation Menu -->
      <div class="d-flex align-items-center w-100">
        <!-- User Pages Navigation Menu (Desktop) -->
        <div class="d-none d-lg-flex align-items-center admin-nav-menu">
          <ul class="navbar-nav flex-row align-items-center">
            <!-- Dashboard -->
            <li 
              v-if="dashboardPage"
              class="nav-item"
            >
              <router-link
                :to="dashboardPage.path"
                class="nav-link text-dark dark:text-light d-flex align-items-center px-2"
                :class="{ 'active': isActivePage(dashboardPage.routeName) }"
                :title="dashboardPage.name"
              >
                <i :class="`fa ${dashboardPage.icon}`"></i>
                <span class="ms-1">{{ dashboardPage.name }}</span>
              </router-link>
            </li>
            
            <!-- Profile -->
            <li 
              v-if="profilePage"
              class="nav-item"
            >
              <router-link
                :to="profilePage.path"
                class="nav-link text-dark dark:text-light d-flex align-items-center px-2"
                :class="{ 'active': isActivePage(profilePage.routeName) }"
                :title="profilePage.name"
              >
                <i :class="`fa ${profilePage.icon}`"></i>
                <span class="ms-1">{{ profilePage.name }}</span>
              </router-link>
            </li>
            
            <!-- Wallet Dropdown (after Profile) -->
            <li 
              class="nav-item dropdown position-relative"
            >
              <a
                ref="walletButton"
                href="#"
                class="nav-link text-dark dark:text-light d-flex align-items-center justify-content-between px-2"
                id="walletMenuButton"
                @click.prevent="toggleWalletMenu"
                :class="{ 'active': isActivePage('Wallet') || showWalletMenu }"
              >
                <span class="d-flex align-items-center">
                  <i class="fa-solid fa fa-wallet"></i>
                  <span class="ms-1">Wallet</span>
                </span>
                <i 
                  class="fa fa-chevron-down ms-2 menu-arrow" 
                  :class="{ 'rotated': showWalletMenu }"
                  style="font-size: 0.75rem; transition: transform 0.3s ease;"
                ></i>
              </a>
              <!-- Wallet Dropdown -->
              <Teleport to="body">
                <div
                  v-show="showWalletMenu"
                  class="wallet-popup"
                  :style="getWalletDropdownStyle()"
                  @mouseenter="handleWalletEnter"
                  @mouseleave="handleWalletLeave"
                >
                <div class="popup-content">
                  <router-link
                    to="/user/wallet?tab=deposit"
                    class="popup-link d-flex align-items-center"
                    :class="{ 'active': isActiveWalletTab('deposit') }"
                    @click="handleWalletLinkClick"
                  >
                    <i class="fa fa-arrow-down me-2"></i>
                    <span>Deposit</span>
                  </router-link>
                  <router-link
                    to="/user/wallet?tab=withdrawal"
                    class="popup-link d-flex align-items-center"
                    :class="{ 'active': isActiveWalletTab('withdrawal') }"
                    @click="handleWalletLinkClick"
                  >
                    <i class="fa fa-arrow-up me-2"></i>
                    <span>Withdrawal</span>
                  </router-link>
                  <router-link
                    to="/user/wallet?tab=transactions"
                    class="popup-link d-flex align-items-center"
                    :class="{ 'active': isActiveWalletTab('transactions') }"
                    @click="handleWalletLinkClick"
                  >
                    <i class="fa fa-history me-2"></i>
                    <span>Transactions</span>
                  </router-link>
                  <router-link
                    to="/user/wallet?tab=bank"
                    class="popup-link d-flex align-items-center"
                    :class="{ 'active': isActiveWalletTab('bank') }"
                    @click="handleWalletLinkClick"
                  >
                    <i class="fa fa-university me-2"></i>
                    <span>Bank Accounts</span>
                  </router-link>
                  <router-link
                    to="/user/wallet?tab=crypto"
                    class="popup-link d-flex align-items-center"
                    :class="{ 'active': isActiveWalletTab('crypto') }"
                    @click="handleWalletLinkClick"
                  >
                    <i class="fa fa-coins me-2"></i>
                    <span>Crypto Wallets</span>
                  </router-link>
                  <router-link
                    to="/user/wallet?tab=internal-transfer"
                    class="popup-link d-flex align-items-center"
                    :class="{ 'active': isActiveWalletTab('internal-transfer') }"
                    @click="handleWalletLinkClick"
                  >
                    <i class="fa fa-exchange-alt me-2"></i>
                    <span>Internal Transfer</span>
                  </router-link>
                </div>
              </div>
              </Teleport>
            </li>
            
            <!-- Remaining menu items (Trading Accounts, KYC, Support) -->
            <li 
              v-for="page in remainingPages" 
              :key="page.path"
              class="nav-item"
            >
              <router-link
                :to="page.path"
                class="nav-link text-dark dark:text-light d-flex align-items-center px-2"
                :class="{ 'active': isActivePage(page.routeName) }"
                :title="page.name"
              >
                <i :class="`fa ${page.icon}`"></i>
                <span class="ms-1">{{ page.name }}</span>
              </router-link>
            </li>
            
            <!-- Information & Tools Dropdown -->
            <li 
              class="nav-item dropdown position-relative"
            >
              <a
                ref="infoToolsButton"
                href="#"
                class="nav-link text-dark dark:text-light d-flex align-items-center justify-content-between px-2"
                id="infoToolsMenuButton"
                @click.prevent="toggleInfoToolsMenu"
                :class="{ 'active': isActivePage('WindowTrader') || isActivePage('MobileTrader') || isActivePage('IOSTrader') || isActivePage('UsefullTools') || showInfoToolsMenu }"
              >
                <span class="d-flex align-items-center">
                <i class="fa fa-wrench me-1"></i>
                <span class="ms-1">Information & Tools</span>
                </span>
                <i 
                  class="fa fa-chevron-down ms-2 menu-arrow" 
                  :class="{ 'rotated': showInfoToolsMenu }"
                  style="font-size: 0.75rem; transition: transform 0.3s ease;"
                ></i>
              </a>
              <!-- Information & Tools Dropdown -->
              <Teleport to="body">
                <div
                  v-show="showInfoToolsMenu"
                  class="information-tools-popup"
                  :style="getDropdownStyle()"
                  @mouseenter="handleInfoToolsEnter"
                  @mouseleave="handleInfoToolsLeave"
                >
                <div class="popup-content">
                  <!-- MetaTrader 5 Submenu -->
                  <div 
                    class="popup-item popup-submenu" 
                    @mouseenter="handleSubmenuEnter" 
                    @mouseleave="handleSubmenuLeave"
                  >
                    <a
                      href="javascript:void(0)"
                      class="popup-link d-flex align-items-center justify-content-between"
                      @click.prevent="showInfoToolsSubmenu = !showInfoToolsSubmenu"
                    >
                      <span class="d-flex align-items-center">
                        <i class="fa fa-desktop me-2"></i>
                        MetaTrader 5
                      </span>
                      <i 
                        class="fa fa-chevron-down ms-2 menu-arrow" 
                        :class="{ 'rotated': showInfoToolsSubmenu }"
                        style="font-size: 0.75rem; transition: transform 0.3s ease;"
                      ></i>
                    </a>
                    <div 
                      class="popup-submenu-content"
                      :class="{ 'show': showInfoToolsSubmenu }"
                      @mouseenter="handleSubmenuEnter"
                      @mouseleave="handleSubmenuLeave"
                    >
                      <router-link
                        to="/user/windowtrader"
                        class="popup-link d-flex align-items-center"
                        :class="{ 'active': isActivePage('WindowTrader') }"
                      >
                        <i class="fa fa-desktop me-2"></i>
                        <span>MT5 TRADER (Windows)</span>
                      </router-link>
                      <router-link
                        to="/user/mobiletrader"
                        class="popup-link d-flex align-items-center"
                        :class="{ 'active': isActivePage('MobileTrader') }"
                      >
                        <i class="fa fa-mobile-alt me-2"></i>
                        <span>Mobile Trader (Android)</span>
                      </router-link>
                      <router-link
                        to="/user/iostrader"
                        class="popup-link d-flex align-items-center"
                        :class="{ 'active': isActivePage('IOSTrader') }"
                      >
                        <i class="fa fa-mobile-alt me-2"></i>
                        <span>Mobile Trader (iOS)</span>
                      </router-link>
                    </div>
                  </div>
                  <hr class="popup-divider" />
                  <router-link
                    to="/user/usefulltools"
                    class="popup-link d-flex align-items-center"
                    :class="{ 'active': isActivePage('UsefullTools') }"
                  >
                    <i class="fa fa-wrench me-2"></i>
                    <span>Useful Tools</span>
                  </router-link>
                </div>
              </div>
              </Teleport>
            </li>
          </ul>
        </div>
      </div>

      <!-- Right Side Icons - ALWAYS VISIBLE -->
      <div class="d-flex align-items-center ms-auto flex-nowrap">
        <ul class="navbar-nav flex-row align-items-center icon-nav-list">
          
          <!-- User Menu -->
          <li class="nav-item dropdown d-flex align-items-center icon-menu-item">
            <a
              href="javascript:void(0)"
              class="p-0 nav-link text-dark dark:text-light d-flex align-items-center justify-content-center icon-button"
              id="userMenuButton"
              @click="toggleUserMenu"
            >
              <i class="fa fa-user" style="font-size: 1.1rem;"></i>
            </a>
            <ul
              class="px-2 py-3 dropdown-menu dropdown-menu-end me-sm-n4 bg-white dark:bg-darkCard"
              :class="{ 'show': showUserMenu }"
              aria-labelledby="userMenuButton"
              @click.stop
            >
              <li>
                <router-link
                  to="/user/profile"
                  class="dropdown-item border-radius-md text-dark dark:text-light"
                  @click="showUserMenu = false"
                >
                  <div class="d-flex align-items-center">
                    <i class="fa fa-user me-2"></i>
                    <span>Profile</span>
                  </div>
                </router-link>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a
                  href="javascript:void(0)"
                  class="dropdown-item border-radius-md text-danger d-flex align-items-center"
                  :class="{ 'disabled': isLoggingOut }"
                  @click="handleLogout"
                >
                  <i class="fas me-2" :class="isLoggingOut ? 'fa-spinner fa-spin' : 'fa-power-off'"></i>
                  <span>{{ isLoggingOut ? 'Logging out...' : 'Logout' }}</span>
                </a>
              </li>
            </ul>
          </li>

          <!-- Notifications -->
          <li class="nav-item dropdown d-flex align-items-center icon-menu-item">
            <div class="position-relative">
              <a
                href="javascript:void(0)"
                class="p-0 nav-link text-dark dark:text-light position-relative d-flex align-items-center justify-content-center icon-button"
                id="notificationButton"
                @click="toggleNotifications"
              >
                <i class="cursor-pointer fa fa-bell" style="font-size: 1.1rem;"></i>
                <span
                  v-if="unreadCount > 0"
                  class="position-absolute top-0 end-0 badge rounded-pill bg-danger"
                  style="font-size: 0.65rem; padding: 0.2rem 0.35rem; min-width: 1.1rem; height: 1.1rem; display: inline-flex; align-items: center; justify-content: center; line-height: 1; transform: translate(25%, -25%);"
                >
                  {{ unreadCount > 99 ? '99+' : unreadCount }}
                </span>
              </a>
            </div>
          </li>

          <!-- Mobile Menu Toggle Button -->
          <li class="nav-item d-lg-none d-flex align-items-center icon-menu-item">
            <a
              href="javascript:void(0)"
              id="mobileMenuToggle"
              class="p-0 nav-link text-dark dark:text-light d-flex align-items-center justify-content-center icon-button"
              @click="toggleMobileMenu"
              aria-label="Toggle navigation menu"
            >
              <i class="fas" :class="showMobileMenu ? 'fa-times' : 'fa-bars'" style="font-size: 1.1rem;"></i>
            </a>
          </li>

        </ul>
      </div>
    </div>
  </nav>

  <!-- Mobile Sidebar Menu (Left Side) -->
  <div
    v-if="showMobileMenu"
    class="mobile-sidebar-overlay"
    @click="showMobileMenu = false"
  ></div>
  <div
    id="mobileNavMenu"
    class="mobile-sidebar"
    :class="{ 'mobile-sidebar-open': showMobileMenu }"
  >
    <div class="mobile-sidebar-header">
      <button
        class="btn btn-link p-0 text-dark"
        @click="showMobileMenu = false"
        aria-label="Close menu"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
    <ul class="mobile-sidebar-nav">
      <!-- Dashboard -->
      <li 
        v-if="dashboardPage"
        class="mobile-sidebar-item"
      >
        <router-link
          :to="dashboardPage.path"
          class="mobile-sidebar-link d-flex align-items-center"
          :class="{ 'active': isActivePage(dashboardPage.routeName) }"
          @click="showMobileMenu = false"
        >
          <i :class="`fa ${dashboardPage.icon} me-3`"></i>
          <span>{{ dashboardPage.name }}</span>
        </router-link>
      </li>
      
      <!-- Profile -->
      <li 
        v-if="profilePage"
        class="mobile-sidebar-item"
      >
        <router-link
          :to="profilePage.path"
          class="mobile-sidebar-link d-flex align-items-center"
          :class="{ 'active': isActivePage(profilePage.routeName) }"
          @click="showMobileMenu = false"
        >
          <i :class="`fa ${profilePage.icon} me-3`"></i>
          <span>{{ profilePage.name }}</span>
        </router-link>
      </li>
      
      <!-- Wallet Mobile Menu -->
      <li class="mobile-sidebar-item">
        <div 
          class="mobile-sidebar-link d-flex align-items-center justify-content-between"
          @click="showMobileWalletMenu = !showMobileWalletMenu"
          style="cursor: pointer;"
        >
          <span class="d-flex align-items-center">
            <i class="fa-solid fa fa-wallet me-3"></i>
            <span>Wallet</span>
          </span>
          <i 
            class="fa fa-chevron-down menu-arrow" 
            :class="{ 'rotated': showMobileWalletMenu }"
            style="font-size: 0.75rem; transition: transform 0.3s ease; margin-right: 0.5rem;"
          ></i>
        </div>
        <ul class="mobile-sidebar-submenu" v-show="showMobileWalletMenu">
          <li>
            <router-link
              to="/user/wallet?tab=deposit"
              class="mobile-sidebar-link d-flex align-items-center ps-5"
              :class="{ 'active': isActiveWalletTab('deposit') }"
              @click="showMobileMenu = false; showMobileWalletMenu = false"
            >
              <i class="fa fa-arrow-down me-3"></i>
              <span>Deposit</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/user/wallet?tab=withdrawal"
              class="mobile-sidebar-link d-flex align-items-center ps-5"
              :class="{ 'active': isActiveWalletTab('withdrawal') }"
              @click="showMobileMenu = false; showMobileWalletMenu = false"
            >
              <i class="fa fa-arrow-up me-3"></i>
              <span>Withdrawal</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/user/wallet?tab=transactions"
              class="mobile-sidebar-link d-flex align-items-center ps-5"
              :class="{ 'active': isActiveWalletTab('transactions') }"
              @click="showMobileMenu = false; showMobileWalletMenu = false"
            >
              <i class="fa fa-history me-3"></i>
              <span>Transactions</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/user/wallet?tab=bank"
              class="mobile-sidebar-link d-flex align-items-center ps-5"
              :class="{ 'active': isActiveWalletTab('bank') }"
              @click="showMobileMenu = false; showMobileWalletMenu = false"
            >
              <i class="fa fa-university me-3"></i>
              <span>Bank Accounts</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/user/wallet?tab=crypto"
              class="mobile-sidebar-link d-flex align-items-center ps-5"
              :class="{ 'active': isActiveWalletTab('crypto') }"
              @click="showMobileMenu = false; showMobileWalletMenu = false"
            >
              <i class="fa fa-coins me-3"></i>
              <span>Crypto Wallets</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/user/wallet?tab=internal-transfer"
              class="mobile-sidebar-link d-flex align-items-center ps-5"
              :class="{ 'active': isActiveWalletTab('internal-transfer') }"
              @click="showMobileMenu = false; showMobileWalletMenu = false"
            >
              <i class="fa fa-exchange-alt me-3"></i>
              <span>Internal Transfer</span>
            </router-link>
          </li>
        </ul>
      </li>
      
      <!-- Remaining menu items (Trading Accounts, KYC, Support) -->
      <li 
        v-for="page in remainingPages" 
        :key="page.path"
        class="mobile-sidebar-item"
      >
        <router-link
          :to="page.path"
          class="mobile-sidebar-link d-flex align-items-center"
          :class="{ 'active': isActivePage(page.routeName) }"
          @click="showMobileMenu = false"
        >
          <i :class="`fa ${page.icon} me-3`"></i>
          <span>{{ page.name }}</span>
        </router-link>
      </li>
      
      <!-- Information & Tools Mobile Menu -->
      <li class="mobile-sidebar-item">
        <div 
          class="mobile-sidebar-link d-flex align-items-center justify-content-between"
          @click="showMobileInfoToolsMenu = !showMobileInfoToolsMenu"
          style="cursor: pointer;"
        >
          <span class="d-flex align-items-center">
          <i class="fa fa-wrench me-3"></i>
          <span>Information & Tools</span>
          </span>
          <i 
            class="fa fa-chevron-down menu-arrow" 
            :class="{ 'rotated': showMobileInfoToolsMenu }"
            style="font-size: 0.75rem; transition: transform 0.3s ease; margin-right: 0.5rem;"
          ></i>
        </div>
        <ul class="mobile-sidebar-submenu" v-show="showMobileInfoToolsMenu">
          <li>
            <router-link
              to="/user/windowtrader"
              class="mobile-sidebar-link d-flex align-items-center ps-5"
              :class="{ 'active': isActivePage('WindowTrader') }"
              @click="showMobileMenu = false"
            >
              <i class="fa fa-windows me-3"></i>
              <span>MT5 TRADER (Windows)</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/user/mobiletrader"
              class="mobile-sidebar-link d-flex align-items-center ps-5"
              :class="{ 'active': isActivePage('MobileTrader') }"
              @click="showMobileMenu = false"
            >
              <i class="fa fa-android me-3"></i>
              <span>Mobile Trader (Android)</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/user/iostrader"
              class="mobile-sidebar-link d-flex align-items-center ps-5"
              :class="{ 'active': isActivePage('IOSTrader') }"
              @click="showMobileMenu = false"
            >
              <i class="fa fa-apple me-3"></i>
              <span>Mobile Trader (iOS)</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/user/usefulltools"
              class="mobile-sidebar-link d-flex align-items-center ps-5"
              :class="{ 'active': isActivePage('UsefullTools') }"
              @click="showMobileMenu = false"
            >
              <i class="fa fa-chart-line me-3"></i>
              <span>Useful Tools</span>
            </router-link>
          </li>
        </ul>
      </li>
    </ul>
  </div>
  
  <!-- Notification Modal Popup -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showNotifications"
        class="notification-overlay"
        @click.self="showNotifications = false"
      >
        <div
          id="notificationDropdown"
          class="notification-panel"
          @click.stop
        >
          <button class="modal-close" @click="showNotifications = false">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <!-- Header -->
          <div class="modal-header-content">
            <h5 class="modal-title text-dark fw-bold">
              <i class="fa fa-bell me-2"></i>
              Notifications
            </h5>
            <div class="notification-actions d-flex align-items-center gap-2 mt-3">
              <span
                v-if="unreadCount > 0"
                class="badge bg-danger"
              >
                {{ unreadCount }} UNREAD
              </span>
              <ArgonButton
                v-if="unreadCount > 0"
                @click.prevent="markAllRead"
                color="primary"
                variant="gradient"
                size="sm"
                type="button"
              >
                Mark all read
              </ArgonButton>
            </div>
          </div>

          <!-- Error Message -->
          <div
            v-if="notificationError"
            class="alert alert-danger mx-0 mt-0 mb-3"
          >
            {{ notificationError }}
          </div>

          <!-- Content -->
          <div class="modal-body-content">
        <div v-if="loadingNotifications" class="text-center text-secondary py-5">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p>Loading notifications...</p>
        </div>
        <div v-else-if="notifications.length === 0" class="text-center text-secondary py-5">
          <i class="fa fa-bell-slash mb-3" style="font-size: 3rem; opacity: 0.3;"></i>
          <p class="mb-0">No notifications yet</p>
        </div>
        <div v-else>
          <div
            v-for="(notification, index) in notifications"
            :key="notification.id || index"
            class="mb-3 p-3 border rounded"
            :class="{ 'bg-light border-primary': !notification.read_at, 'border-secondary': notification.read_at }"
            style="cursor: pointer; transition: all 0.2s;"
            @click="handleNotificationClick(notification)"
          >
            <div class="d-flex">
              <div
                v-if="!notification.read_at"
                class="my-auto me-3"
                style="width: 8px; height: 8px; background-color: #e91e63; border-radius: 50%; flex-shrink: 0;"
              ></div>
              <div class="flex-grow-1">
                <h6 class="mb-2 fw-bold">
                  {{ getNotificationTitle(notification) }}
                </h6>
                <p class="mb-2 text-secondary" style="white-space: pre-line; word-wrap: break-word;">
                  {{ getNotificationMessage(notification) }}
                </p>
                <p class="mb-0 text-muted small">
                  <i class="fa fa-clock me-1"></i>
                  {{ formatTime(getNotificationCreatedAt(notification)) }}
                </p>
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Mobile menu toggle button */
#mobileMenuToggle {
  cursor: pointer;
}

#mobileMenuToggle:hover {
  opacity: 0.7;
}

/* Right side icons alignment and spacing */
.navbar-nav.flex-row > .nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Icon navigation list - consistent spacing */
.icon-nav-list {
  gap: 0.5rem !important;
}

/* All icon buttons - consistent sizing */
.icon-menu-item .icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  min-width: 36px;
  padding: 0;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.icon-menu-item .icon-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.icon-menu-item .icon-button i {
  font-size: 1.1rem;
  line-height: 1;
}

/* Mobile icon spacing fix */
@media (max-width: 575.98px) {
  .icon-nav-list {
    gap: 0.375rem !important;
  }
  
  .icon-menu-item .icon-button {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }
  
  .icon-menu-item .icon-button i {
    font-size: 1rem;
  }
}

/* Ensure icons are always in a row */
.navbar-nav.flex-row {
  flex-direction: row !important;
}

/* Dropdown styling */
.dropdown-menu {
  display: none;
  position: absolute;
}

.dropdown-menu.show {
  display: block;
}

.dropdown-item.disabled {
  pointer-events: none;
  opacity: 0.6;
}

/* Cursor pointer for clickable items */
.nav-link {
  cursor: pointer;
}

/* User Navigation Menu Styles */
.admin-nav-menu {
  overflow-x: auto;
  overflow-y: visible;
  max-width: 100%;
}

.admin-nav-menu .navbar-nav {
  flex-wrap: nowrap;
  gap: 0.25rem;
  justify-content: flex-start;
  overflow: visible;
}

.admin-nav-menu .nav-link {
  white-space: nowrap;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  padding: 0.5rem 0.75rem !important;
  box-shadow: black;
}

.admin-nav-menu .nav-link:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.admin-nav-menu .nav-link.active {
  background-color: #000000;
  color: #ffffff !important;
}

.admin-nav-menu .nav-link.active i {
  color: #ffffff !important;
}

.admin-nav-menu .nav-link i {
  font-size: 1rem;
}

/* Mobile Sidebar Styles */
.mobile-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1040;
  transition: opacity 0.3s ease;
}

.mobile-sidebar {
  position: fixed;
  top: 0;
  left: -100%;
  width: 280px;
  max-width: 85vw;
  height: 100vh;
  background-color: #ffffff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1050;
  transition: left 0.3s ease;
  overflow-y: auto;
}

.mobile-sidebar.mobile-sidebar-open {
  left: 0;
}

.mobile-sidebar-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.mobile-sidebar-header button {
  font-size: 1.25rem;
  color: #212529;
}

.mobile-sidebar-header button:hover {
  opacity: 0.7;
}

.mobile-sidebar-nav {
  list-style: none;
  padding: 0;
  margin: 0;
}

.mobile-sidebar-item {
  border-bottom: 1px solid #f0f0f0;
}

.mobile-sidebar-submenu {
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: #f8f9fa;
}

.mobile-sidebar-submenu .mobile-sidebar-link {
  padding-left: 3rem !important;
  font-size: 0.9rem;
}

.mobile-sidebar-link {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: #212529;
  text-decoration: none;
  transition: all 0.2s ease;
}

.mobile-sidebar-link:hover {
  background-color: #f8f9fa;
  color: #212529;
}

.mobile-sidebar-link.active {
  background-color: #000000;
  color: #ffffff;
}

.mobile-sidebar-link.active i {
  color: #ffffff;
}

.mobile-sidebar-link i {
  font-size: 1.1rem;
  width: 24px;
  text-align: center;
}

/* Menu arrow rotation */
.menu-arrow {
  transition: transform 0.3s ease;
}

.menu-arrow.rotated {
  transform: rotate(180deg);
}

/* Ensure dropdown shows on hover */
.nav-item.dropdown:hover > .dropdown-menu {
  display: block !important;
}

/* Fix dropdown positioning */
.nav-item.dropdown .dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  margin-top: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.375rem;
  padding: 0.5rem 0;
  min-width: 220px;
}

/* Ensure dropdown shows on click */
.dropdown-menu.show {
  display: block !important;
}

/* Match nav-link styling exactly */
.nav-item.dropdown > .nav-link {
  white-space: nowrap;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  padding: 0.5rem 0.75rem !important;
}

.nav-item.dropdown > .nav-link:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.nav-item.dropdown > .nav-link.active {
  background-color: #000000;
  color: #ffffff !important;
}

.nav-item.dropdown > .nav-link.active i {
  color: #ffffff !important;
}

/* Information & Tools dropdown specific styling */
#infoToolsMenuButton {
  cursor: pointer;
}

#walletMenuButton {
  cursor: pointer;
}

.information-tools-popup {
  position: fixed !important;
  z-index: 9999 !important;
  min-width: 220px;
  animation: fadeIn 0.2s ease;
}

.wallet-popup {
  position: fixed !important;
  z-index: 9999 !important;
  min-width: 220px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popup-content {
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.375rem;
  padding: 0.5rem 0;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.popup-item {
  position: relative;
}

.popup-link {
  padding: 0.5rem 1rem;
  color: #212529;
  transition: background-color 0.15s ease-in-out;
  text-decoration: none;
  display: block;
  width: 100%;
}

.popup-link:hover {
  background-color: #f8f9fa;
  color: #212529;
  text-decoration: none;
}

.popup-link.active {
  background-color: #000000;
  color: #ffffff;
}

.popup-link.active i {
  color: #ffffff;
}

.popup-divider {
  margin: 0.5rem 0;
  border-top: 1px solid rgba(0, 0, 0, 0.15);
  border-bottom: none;
}

.popup-submenu-content {
  position: absolute;
  left: 100%;
  top: 0;
  margin-top: 0;
  min-width: 220px;
  z-index: 10000;
  margin-left: 0.25rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.375rem;
  padding: 0.5rem 0;
  display: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease, visibility 0.15s ease;
}

.popup-submenu-content.show {
  display: block !important;
  opacity: 1;
  visibility: visible;
}

.popup-submenu:hover .popup-submenu-content {
  display: block !important;
  opacity: 1;
  visibility: visible;
}

/* Dropdown menu styling */
.dropdown-menu {
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.375rem;
  padding: 0.5rem 0;
}

.dropdown-item {
  padding: 0.5rem 1rem;
  color: #212529;
  transition: background-color 0.15s ease-in-out;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
  color: #212529;
}

.dropdown-item.active {
  background-color: #000000;
  color: #ffffff;
}

.dropdown-item.active i {
  color: #ffffff;
}

/* Mobile responsive */
@media (max-width: 991.98px) {
  .navbar-main .container-fluid {
    flex-wrap: wrap;
  }
}

@media (max-width: 575.98px) {
  .admin-nav-menu .nav-link {
    padding: 0.4rem 0.5rem !important;
    font-size: 0.875rem;
  }
  
  .admin-nav-menu .nav-link i {
    font-size: 0.9rem;
  }
}

/* Notifications modal - Matching Add Deposit modal style */
.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.notification-panel {
  background: white;
  border-radius: 16px;
  max-width: 620px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  padding: 32px;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.modal-close:hover {
  background-color: #e5e5e5;
  transform: rotate(90deg);
}

.modal-close svg {
  width: 20px;
  height: 20px;
  color: #333;
}

.modal-header-content {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
}

.modal-title {
  font-size: 1.25rem;
  margin-bottom: 0;
}

.modal-body-content {
  padding: 0;
  max-height: calc(90vh - 200px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.notification-actions {
  margin-top: 12px;
}

/* Modal Animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .notification-panel,
.modal-leave-active .notification-panel {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .notification-panel,
.modal-leave-to .notification-panel {
  transform: scale(0.9) translateY(-20px);
}

@media (max-width: 575.98px) {
  .notification-overlay {
    padding: 12px;
  }

  .notification-panel {
    max-width: 100%;
    max-height: calc(100vh - 24px);
    padding: 24px 20px;
  }

  .modal-close {
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
  }

  .modal-close svg {
    width: 18px;
    height: 18px;
  }

  .modal-header-content {
    margin-bottom: 20px;
    padding-bottom: 12px;
  }

  .modal-title {
    font-size: 1.1rem;
  }

  .modal-body-content {
    max-height: calc(100vh - 180px);
  }

  .notification-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>