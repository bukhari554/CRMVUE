<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import { apiPost, apiGet, apiPatch } from "@/utils/api.js";

/* eslint-disable no-unused-vars */

<<<<<<< HEAD
const showMenu = ref(false);
=======
>>>>>>> c8bfd604f7b3004e47339c65e5f4ada82f16cd70
const showUserMenu = ref(false);
const showMobileMenu = ref(false);
const isLoggingOut = ref(false);
const store = useStore();
const router = useRouter();

const route = useRoute();

// Notification state
const notifications = ref([]);
const loadingNotifications = ref(false);
const showNotifications = ref(false);
const notificationError = ref("");

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read_at).length;
});

const currentRouteName = computed(() => {
  return route.name;
});

// User pages navigation menu
const userPages = [
  { name: 'Dashboard', path: '/user/dashboard', icon: 'fa-tachometer-alt', routeName: 'UserDashboard' },
  { name: 'Profile', path: '/user/profile', icon: 'fa-user', routeName: 'UserProfile' },
  { name: 'Tickets', path: '/user/tickets', icon: 'fa-ticket-alt', routeName: 'UserTickets' },
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

<<<<<<< HEAD
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
=======
const closeUserMenu = () => {
  showUserMenu.value = false;
};

const handleLogout = async () => {
  // First close the menu immediately
  showUserMenu.value = false;
  
  try {
    const response = await apiPost("/client/logout", {});
    console.log("Logout API response:", response);
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Logout locally regardless of API response
    store.dispatch("logout");
    router.push("/signin");
>>>>>>> c8bfd604f7b3004e47339c65e5f4ada82f16cd70
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
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
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
  } catch (error) {
    console.error("Error loading notifications:", error);
    notificationError.value = "Failed to load notifications";
    notifications.value = [];
  } finally {
    loadingNotifications.value = false;
  }
};

const toggleNotifications = (event) => {
  event?.stopPropagation();
  showNotifications.value = !showNotifications.value;
  showMenu.value = false; // Close other dropdown
  if (showNotifications.value && !loadingNotifications.value) {
    // Always reload notifications when opening to get latest updates
    loadNotifications();
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
  if (notification.read_at) return;
  
  // Optimistically update
  const originalReadAt = notification.read_at;
  const notificationIndex = notifications.value.findIndex(n => n.id === notification.id);
  
  if (notificationIndex !== -1) {
    notifications.value[notificationIndex] = {
      ...notifications.value[notificationIndex],
      read_at: new Date().toISOString()
    };
  }
  
  try {
    const response = await apiPatch(`/client/notifications/${notification.id}/read`, {});
    const data = await response.json();
    
    if (!data.success && !response.ok) {
      // Revert on error
      if (notificationIndex !== -1) {
        notifications.value[notificationIndex] = {
          ...notifications.value[notificationIndex],
          read_at: originalReadAt
        };
      }
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    // Revert on error
    if (notificationIndex !== -1) {
      notifications.value[notificationIndex] = {
        ...notifications.value[notificationIndex],
        read_at: originalReadAt
      };
    }
  }
};

const formatTime = (dateString) => {
  if (!dateString) return "Unknown";
  
  try {
    const date = new Date(dateString);
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
    return "Unknown";
  }
};

</script>
<<<<<<< HEAD

<template>
  <nav class="navbar navbar-main navbar-expand-lg px-1 shadow-none border-radius-xl bg-white">
    <div class="px-3 py-1 container-fluid d-flex align-items-center">
      <!-- Left Side: User Pages Navigation Menu -->
      <div class="d-flex align-items-center w-100">
        <!-- User Pages Navigation Menu (Desktop) -->
        <div class="d-none d-lg-flex align-items-center admin-nav-menu">
          <ul class="navbar-nav flex-row align-items-center">
            <li 
              v-for="page in userPages" 
              :key="page.path"
              class="nav-item"
=======

<template>
  <nav
    class="navbar navbar-main navbar-expand-lg px-0 mx-4 shadow-none border-radius-xl"
    v-bind="$attrs"
    id="navbarBlur"
    data-scroll="true"
  >
    <div class="px-3 py-1 container-fluid">
      <breadcrumbs
        :current-page="currentRouteName"
        :current-directory="currentDirectory"
      />

      <div
        class="mt-2 collapse navbar-collapse mt-sm-0 me-md-0 me-sm-4"
        id="navbar"
      >
        <ul class="navbar-nav justify-content-end ms-md-auto">
          <li
            class="nav-item dropdown d-flex align-items-center pe-2"
          >
              <a 
              href="#"
              class="p-0 nav-link text-white d-flex align-items-center"
              :class="[showUserMenu ? 'show' : '']"
              id="userMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              @click.prevent="showUserMenu = !showUserMenu"
>>>>>>> c8bfd604f7b3004e47339c65e5f4ada82f16cd70
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
<<<<<<< HEAD
                  to="/user/profile"
                  class="dropdown-item border-radius-md text-dark dark:text-light"
                  @click="showUserMenu = false"
=======
                  to="/profile"
                  class="dropdown-item border-radius-md"
                  @click="closeUserMenu"
>>>>>>> c8bfd604f7b3004e47339c65e5f4ada82f16cd70
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
<<<<<<< HEAD

          <!-- Notifications -->
          <li class="nav-item dropdown d-flex align-items-center">
            <div class="position-relative">
              <a
                href="javascript:void(0)"
                class="p-0 nav-link text-dark dark:text-light position-relative"
=======
          <li
            class="nav-item dropdown d-flex align-items-center pe-2"
          >
            <div class="position-relative">
                <a
                href="#"
                class="p-0 nav-link text-white position-relative"
>>>>>>> c8bfd604f7b3004e47339c65e5f4ada82f16cd70
                id="notificationButton"
                @click="toggleNotifications"
              >
                <i class="cursor-pointer fa fa-bell"></i>
                <span
                  v-if="unreadCount > 0"
                  class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style="font-size: 0.5rem; padding: 0.2rem 0.3rem; min-width: 0.6rem; height: 0.6rem;"
                ></span>
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
        v-for="page in userPages" 
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
  <div
    v-if="showNotifications"
    class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
    style="background-color: rgba(0, 0, 0, 0.5); z-index: 1050;"
    @click.self="showNotifications = false"
  >
    <div
      id="notificationDropdown"
      class="bg-white rounded-3 shadow-lg"
      style="width: 90%; max-width: 600px; max-height: 80vh; display: flex; flex-direction: column;"
      @click.stop
    >
      <!-- Header -->
      <div class="p-4 border-bottom">
        <div class="d-flex justify-content-between align-items-center">
          <h4 class="mb-0 fw-bold d-flex align-items-center">
            <i class="fa fa-bell me-2"></i>
            Notifications
            <span
              v-if="unreadCount > 0"
              class="badge bg-danger ms-2"
            >
              {{ unreadCount }} unread
            </span>
          </h4>
          <div class="d-flex align-items-center gap-2">
            <button
              v-if="unreadCount > 0"
              @click.prevent="markAllRead"
              class="btn btn-sm btn-primary"
            >
              Mark all read
            </button>
            <button
              type="button"
              class="btn btn-sm btn-link text-dark p-0"
              @click="showNotifications = false"
            >
              <i class="fas fa-times" style="font-size: 1.2rem;"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="notificationError"
        class="alert alert-danger mx-4 mt-3 mb-0"
      >
        {{ notificationError }}
      </div>

      <!-- Content -->
      <div class="flex-grow-1 overflow-auto px-4 py-3" style="max-height: calc(80vh - 120px);">
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
            v-for="notification in notifications"
            :key="notification.id"
            class="mb-3 p-3 border rounded"
            :class="{ 'bg-light border-primary': !notification.read_at, 'border-secondary': notification.read_at }"
            style="cursor: pointer; transition: all 0.2s;"
            @click="markOneRead(notification)"
          >
            <div class="d-flex">
              <div
                v-if="!notification.read_at"
                class="my-auto me-3"
                style="width: 8px; height: 8px; background-color: #e91e63; border-radius: 50%; flex-shrink: 0;"
              ></div>
              <div class="flex-grow-1">
                <h6 class="mb-2 fw-bold">
                  {{ notification.title || notification.subject || 'Notification' }}
                </h6>
                <p class="mb-2 text-secondary" style="white-space: normal; word-wrap: break-word;">
                  {{ notification.message || notification.body || '' }}
                </p>
                <p class="mb-0 text-muted small">
                  <i class="fa fa-clock me-1"></i>
                  {{ formatTime(notification.created_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
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

/* User Navigation Menu Styles */
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
</style>