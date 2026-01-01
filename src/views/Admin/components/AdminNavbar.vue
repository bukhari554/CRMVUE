<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import { apiPost, apiGet, apiPatch } from "@/utils/api.js";
import ArgonButton from "@/components/ArgonButton.vue";

const showMenu = ref(false);
const showUserMenu = ref(false);
const showMobileMenu = ref(false);
const isLoggingOut = ref(false);
const store = useStore();
const router = useRouter();

// Notification state
const notifications = ref([]);
const loadingNotifications = ref(false);
const showNotifications = ref(false);
const notificationError = ref("");
const lastNotificationsFetchAt = ref(0);

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read_at).length;
});

const route = useRoute();

const currentRouteName = computed(() => {
  return route.name;
});
const currentDirectory = computed(() => {
  let dir = route.path.split("/")[1];
  return dir.charAt(0).toUpperCase() + dir.slice(1);
});

// Admin pages navigation menu
const adminPages = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: 'fa-tachometer-alt', routeName: 'AdminDashboard' },
  { name: 'Clients', path: '/admin/clients', icon: 'fa-users', routeName: 'Clients' },
  { name: 'Deposit', path: '/admin/Deposit', icon: 'fa-money-bill-wave', routeName: 'Deposit' },
  { name: 'Withdrawal', path: '/admin/withdrawl', icon: 'fa-credit-card', routeName: 'Withdrawl' },
  { name: 'Payment Methods', path: '/admin/payment-methods', icon: 'fa-wallet', routeName: 'PaymentMethods' },
  { name: 'KYC Request', path: '/admin/kycrequest', icon: 'fa-id-card', routeName: 'KYCRequest' },
  { name: 'Tickets', path: '/admin/admintickets', icon: 'fa-ticket-alt', routeName: 'AdminTickets' },
  { name: 'Account Types', path: '/admin/account-types', icon: 'fa-credit-card', routeName: 'AccountTypes' },
  { name: 'Settings', path: '/admin/settings', icon: 'fa-cog', routeName: 'AdminSettings' },
];

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
  
  if (userMenuEl && !userMenuEl.closest('.dropdown')?.contains(event.target)) {
    showUserMenu.value = false;
  }
  if (notifMenuEl && !notifMenuEl.closest('.dropdown')?.contains(event.target)) {
    showMenu.value = false;
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
});

const toggleUserMenu = (event) => {
  event.stopPropagation();
  showUserMenu.value = !showUserMenu.value;
  showMenu.value = false; // Close other dropdown
};

// Notification functions
const loadNotifications = async () => {
  loadingNotifications.value = true;
  notificationError.value = "";
  try {
    const response = await apiGet("/admin/notifications");
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
    const response = await apiPatch("/admin/notifications/read-all", {});
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
    const response = await apiPatch(`/admin/notifications/${notificationId}/read`, {});
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
  const typeLower = type.toLowerCase();
  const title = getNotificationTitle(notification) || "";
  const titleLower = title.toLowerCase();
  const message = getNotificationMessage(notification) || "";
  const messageLower = message.toLowerCase();
  
  // Ticket/Support related notifications - check type, title, and message
  if (typeLower.includes("ticket") || 
      titleLower.includes("ticket") || 
      titleLower.includes("reply") ||
      messageLower.includes("ticket") ||
      messageLower.includes("subject:")) {
    return "/admin/admintickets";
  }
  
  // KYC/Document related notifications - check type, title, and message
  if (typeLower.includes("kyc") || 
      typeLower === "document_status_updated" ||
      typeLower.includes("document") ||
      titleLower.includes("document") ||
      titleLower.includes("kyc") ||
      messageLower.includes("document") ||
      messageLower.includes("driver license") ||
      messageLower.includes("bank statement") ||
      messageLower.includes("passport") ||
      messageLower.includes("id card")) {
    return "/admin/kycrequest";
  }
  
  // Deposit related notifications
  if (typeLower.includes("deposit") || 
      titleLower.includes("deposit") ||
      messageLower.includes("deposit")) {
    return "/admin/Deposit";
  }
  
  // Withdrawal notifications
  if (typeLower.includes("withdrawal") ||
      titleLower.includes("withdrawal") ||
      messageLower.includes("withdrawal")) {
    return "/admin/withdrawl";
  }
  
  // Transfer notifications
  if (typeLower === "transfer_completed" ||
      titleLower.includes("transfer") ||
      messageLower.includes("transfer")) {
    return "/admin/clients";
  }
  
  // Trading account notifications
  if (typeLower === "trading_account_created" ||
      titleLower.includes("trading account") ||
      messageLower.includes("trading account")) {
    return "/admin/clients";
  }
  
  // Transaction notifications
  if (typeLower === "transaction_approved" ||
      titleLower.includes("transaction") ||
      messageLower.includes("transaction")) {
    return "/admin/Deposit";
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

const handleLogout = async (event) => {
  // Stop event bubbling
  event.stopPropagation();
  
  // Prevent double clicks
  if (isLoggingOut.value) return;
  isLoggingOut.value = true;
  
  console.log("🔄 Logout started...");
  
  try {
    // Get token for debugging
    const token = localStorage.getItem("admin_token") || store.state.adminToken;
    console.log("📌 Token exists:", !!token);
    
    // Call logout API
    const response = await apiPost("/admin/logout", null);
    console.log("✅ Logout API response:", response);
    
  } catch (error) {
    console.error("❌ Logout API error:", error);
  }
  
  // Always cleanup and redirect (even if API fails)
  console.log("🧹 Cleaning up...");
  
  // Clear all auth data
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
  
  // Dispatch Vuex logout
  store.dispatch("logout");
  
  console.log("✅ Redirecting to login...");
  
  isLoggingOut.value = false;
  showUserMenu.value = false;
  
  // Redirect to login
  router.push("/admin-signin");
};
</script>

<template>
  <nav class="navbar navbar-main navbar-expand-lg shadow-none border-radius-xl bg-white">
    <div class="px-3 py-1 container-fluid d-flex align-items-center" style="background-color: #ffffff !important;">
      <!-- Left Side: Breadcrumbs and Admin Pages Navigation Menu -->
      <div class="d-flex align-items-center w-100">
        <breadcrumbs
          :current-page="currentRouteName"
          :current-directory="currentDirectory"
        />
        
        <!-- Admin Pages Navigation Menu (Desktop) -->
        <div class="d-none d-lg-flex align-items-center admin-nav-menu ms-3">
          <ul class="navbar-nav flex-row align-items-center">
            <li 
              v-for="page in adminPages" 
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
          </ul>
        </div>
      </div>

      <!-- Right Side Icons - ALWAYS VISIBLE -->
      <div class="d-flex align-items-center ms-auto flex-nowrap">
        <ul class="navbar-nav flex-row align-items-center">
          
          <!-- User Menu -->
          <li class="nav-item dropdown d-flex align-items-center pe-2">
            <a
              href="javascript:void(0)"
              class="p-0 nav-link text-dark dark:text-light d-flex align-items-center"
              id="userMenuButton"
              @click="toggleUserMenu"
            >
              <i class="fa fa-user me-sm-2"></i>
              <span class="d-none d-sm-inline text-truncate text-nowrap d-inline-block" style="max-width: 120px;">{{ userName }}</span>

              <i class="fas fa-chevron-down ms-2 d-none d-sm-inline text-dark dark:text-light" style="font-size: 0.75rem;"></i>
            </a>
            <ul
              class="px-2 py-3 dropdown-menu dropdown-menu-end me-sm-n4 bg-white dark:bg-darkCard"
              :class="{ 'show': showUserMenu }"
              aria-labelledby="userMenuButton"
              @click.stop
            >
              <li>
                <router-link
                  to="/admin/profile"
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
          <li class="nav-item dropdown d-flex align-items-center">
            <div class="position-relative">
              <a
                href="javascript:void(0)"
                class="p-0 nav-link text-dark dark:text-light position-relative"
                id="notificationButton"
                @click="toggleNotifications"
              >
                <i class="cursor-pointer fa fa-bell"></i>
                <span
                  v-if="unreadCount > 0"
                  class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style="font-size: 0.65rem; padding: 0.2rem 0.35rem; min-width: 1.1rem; height: 1.1rem; display: inline-flex; align-items: center; justify-content: center; line-height: 1;"
                >
                  {{ unreadCount > 99 ? '99+' : unreadCount }}
                </span>
              </a>
            </div>
          </li>

          <!-- Mobile Menu Toggle Button -->
          <li class="nav-item d-lg-none d-flex align-items-center">
            <a
              href="javascript:void(0)"
              id="mobileMenuToggle"
              class="p-0 nav-link text-dark dark:text-light"
              @click="toggleMobileMenu"
              aria-label="Toggle navigation menu"
            >
              <i class="fas" :class="showMobileMenu ? 'fa-times' : 'fa-bars'"></i>
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
      <li 
        v-for="page in adminPages" 
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

/* Mobile icon spacing fix */
@media (max-width: 575.98px) {
  .navbar-nav .nav-item {
    padding-left: 8px;
    padding-right: 8px;
  }
  
  .navbar-nav .nav-link i {
    font-size: 1.1rem;
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

/* Admin Navigation Menu Styles */
.admin-nav-menu {
  overflow-x: auto;
  max-width: 100%;
}

.admin-nav-menu .navbar-nav {
  flex-wrap: nowrap;
  gap: 0.25rem;
  justify-content: flex-start;
}

.admin-nav-menu .nav-link {
  white-space: nowrap;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  padding: 0.5rem 0.75rem !important;
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