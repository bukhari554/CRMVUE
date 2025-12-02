<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import Breadcrumbs from "@/examples/Breadcrumbs.vue";
import { apiPost, apiGet, apiPatch } from "@/utils/api.js";

/* eslint-disable no-unused-vars */

const showUserMenu = ref(false);
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
const currentDirectory = computed(() => {
  let dir = route.path.split("/")[1];
  return dir.charAt(0).toUpperCase() + dir.slice(1);
});

const currentUser = computed(() => store.getters.currentUser);
const userName = computed(() => {
  if (currentUser.value) {
    return currentUser.value.name || 
           `${currentUser.value.first_name || ''} ${currentUser.value.last_name || ''}`.trim() ||
           currentUser.value.email;
  }
  return "User";
});

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
  }
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

// Click outside handler (for modal backdrop)
const handleClickOutside = (event) => {
  const target = event.target;
  const notificationDropdown = document.getElementById("notificationDropdown");
  const notificationButton = document.getElementById("notificationButton");
  
  // Only handle if clicking on the backdrop (the overlay div itself)
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
  loadNotifications();
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

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
            >
              <i class="fa fa-user me-2"></i>
              <span class="d-sm-inline d-none">{{ userName }}</span>
              <i class="fas fa-chevron-down ms-2" style="font-size: 0.75rem;"></i>
            </a>
            <ul
              class="px-2 py-3 dropdown-menu dropdown-menu-end me-sm-n4"
              :class="showUserMenu ? 'show' : ''"
              aria-labelledby="userMenuButton"
            >
              <li>
                <router-link
                  to="/profile"
                  class="dropdown-item border-radius-md"
                  @click="closeUserMenu"
                >
                  <div class="d-flex align-items-center">
                    <i class="fa fa-user me-2"></i>
                    <span>Profile</span>
                  </div>
                </router-link>
              </li>
              <li>
                <hr class="dropdown-divider" />
              </li>
              <li>
                <a
                  href="#"
                  class="dropdown-item border-radius-md text-danger"
                  @click.prevent="handleLogout"
                >
                  <div class="d-flex align-items-center">
                    <i class="fa fa-sign-out me-2"></i>
                    <span>Logout</span>
                  </div>
                </a>
              </li>
            </ul>
          </li>
          <li
            class="nav-item dropdown d-flex align-items-center pe-2"
          >
            <div class="position-relative">
                <a
                href="#"
                class="p-0 nav-link text-white position-relative"
                id="notificationButton"
                @click.stop.prevent="toggleNotifications"
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
        </ul>
      </div>
    </div>
  </nav>
  
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